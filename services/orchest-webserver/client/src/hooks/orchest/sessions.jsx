// @ts-check
import React from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { useOrchest } from "./context";
import { isSession } from "./utils";

/**
 * @typedef {import("@/types").IOrchestSessionUuid } IOrchestSessionUuid
 * @typedef {import("@/types").IOrchestSession} IOrchestSession
 * @typedef {IOrchestSession['status']} TSessionStatus
 */

const ENDPOINT = "/catch/api-proxy/api/sessions/";

/* Matchers
  =========================================== */

/**  @param {TSessionStatus} status */
const isLaunchable = (status) => !status;

/**  @param {TSessionStatus} status */
const isStoppable = (status) => ["RUNNING", "LAUNCHING"].includes(status);

/**  @param {TSessionStatus} status */
const isWorking = (status) => ["LAUNCHING", "STOPPING"].includes(status);

/* Fetchers
  =========================================== */

/**  @param {IOrchestSessionUuid} props */
const stopSession = ({ pipeline_uuid, project_uuid }) =>
  fetcher([ENDPOINT, project_uuid, "/", pipeline_uuid].join(""), {
    method: "DELETE",
  });

/* Provider
  =========================================== */

export const OrchestSessionsProvider = ({ children }) => {
  const { state, dispatch } = useOrchest();

  const { _sessionsIsPolling } = state;

  /**
   * Use SWR to fetch and cache the data from our sessions endpoint
   *
   * Note: the endpoint does **not** return `STOPPED` sessions. This is handled
   * in a later side-effect.
   */
  const { data, mutate, error } = useSWR(ENDPOINT, fetcher, {
    refreshInterval: _sessionsIsPolling ? 1000 : 0,
  });
  const isLoading = !data && !error;
  const isLoaded = !isLoading;

  if (error) {
    console.error("Unable to fetch sessions", error);
  }

  /**
   * SYNC
   *
   * Push SWR changes to Orchest Context when at least one session exists
   */
  React.useEffect(() => {
    dispatch({
      type: "_sessionsSet",
      payload: { sessions: data?.sessions || [], sessionsIsLoading: isLoading },
    });
  }, [data, isLoading]);

  /**
   * TOGGLE
   */
  React.useEffect(() => {
    /* If the session doesn't exist in the cache, use the toggle payload */
    const session =
      (isLoaded &&
        data?.sessions?.find((dataSession) =>
          isSession(dataSession, state?._sessionsToggle)
        )) ||
      state?._sessionsToggle;

    if (!session) {
      dispatch({ type: "_sessionsToggleClear" });
      return;
    }

    /**
     * Any session-specific cache mutations must be made with this helper to
     * ensure we're only mutating the requested session
     * @param {Partial<IOrchestSession>} [newSessionData]
     * @param {boolean} [shouldRevalidate]
     * @returns
     */
    const mutateSession = (newSessionData, shouldRevalidate) =>
      mutate(
        (cachedData) =>
          newSessionData && {
            ...cachedData,
            sessions: cachedData?.sessions.map((sessionData) =>
              sessionData && isSession(session, sessionData)
                ? { ...sessionData, ...newSessionData }
                : sessionData
            ),
          },
        shouldRevalidate
      );

    /**
     * LAUNCH
     */
    if (isLaunchable(session.status)) {
      mutateSession({ status: "LAUNCHING" }, false);

      fetcher(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          pipeline_uuid: session.pipeline_uuid,
          project_uuid: session.project_uuid,
        }),
      })
        .then((sessionDetails) => mutateSession(sessionDetails))
        .catch((err) => {
          let errorBody = JSON.parse(err.body);
          if (errorBody?.message == "MemoryServerRestartInProgress") {
            dispatch({
              type: "alert",
              payload: [
                "The session can't be launched while the memory server is being restarted.",
              ],
            });
          } else {
            console.error(err);
          }
        });

      dispatch({ type: "_sessionsToggleClear" });
      return;
    }

    /**
     * WORKING
     * Note: Our UI should prevent users from ever seeing this error – e.g. by
     * disabling buttons – but it's here just in case.
     */
    if (isWorking(session.status)) {
      dispatch({
        type: "alert",
        payload: [
          "Error",
          "Please wait, the pipeline session is still " +
            { STARTING: "launching", STOPPING: "shutting down" }[
              session.status
            ] +
            ".",
        ],
      });
      dispatch({ type: "_sessionsToggleClear" });
      return;
    }

    /**
     * DELETE
     */
    if (isStoppable(session.status)) {
      mutateSession({ status: "STOPPING" }, false);

      stopSession(session)
        .then(() => mutate())
        .catch((err) => {
          if (err?.message === "MemoryServerRestartInProgress") {
            dispatch({
              type: "alert",
              payload: [
                "The session can't be stopped while the memory server is being restarted.",
              ],
            });
          } else {
            console.error(err);
          }
        });
      dispatch({ type: "_sessionsToggleClear" });
      return;
    }

    dispatch({ type: "_sessionsToggleClear" });
  }, [state._sessionsToggle]);

  /**
   * DELETE ALL
   */
  React.useEffect(() => {
    if (state.sessionsKillAllInProgress !== true || !data) return;

    // Mutate `isStoppable` sessions to "STOPPING"
    mutate(
      (cachedData) => ({
        ...cachedData,
        sessions: cachedData?.sessions.map((sessionValue) => ({
          ...sessionValue,
          status: isStoppable(sessionValue.status)
            ? "STOPPING"
            : sessionValue.status,
        })),
      }),
      false
    );

    // Send delete requests for `isStoppable` sessions
    Promise.all(
      data?.sessions
        .filter((sessionData) => isStoppable(sessionData.status))
        .map((sessionData) => stopSession(sessionData))
    )
      .then(() => {
        mutate();
        dispatch({
          type: "_sessionsKillAllClear",
        });
      })
      .catch((err) => {
        console.error("Unable to stop all sessions", err);
        dispatch({
          type: "_sessionsKillAllClear",
        });
      });
  }, [state.sessionsKillAllInProgress]);

  return <React.Fragment>{children}</React.Fragment>;
};

/* Consumer
  =========================================== */

/**
 * OrchestSessionsConsumer
 *
 * In an ideal scenario, we'd just use the SWR hook directly to only trigger
 * polling where it's used. Unfortunately, that's not an option until all of our
 * codebase has moved away from class-based components.
 *
 * In the meantime, we'll wrap this Component around session-dependent views or
 * components to explicitly trigger polling.
 */
export const OrchestSessionsConsumer = ({ children }) => {
  const { dispatch } = useOrchest();

  React.useEffect(() => {
    dispatch({ type: "_sessionsPollingStart" });
    return () => {
      dispatch({ type: "_sessionsPollingClear" });
    };
  }, []);

  return <React.Fragment>{children}</React.Fragment>;
};
