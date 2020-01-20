import { Reducer, Action, AnyAction } from 'redux'

declare namespace ReduxUndo {
  export interface StateWithHistory<State> {
    past: State[]
    present: State
    future: State[]
    _latestUnfiltered: State
    group: any
    index: number
    limit: number
  }

  export type FilterFunction<State> = (
    action: Action,
    currentState: State,
    previousHistory: StateWithHistory<State>
  ) => boolean

  export type GroupByFunction<State> = (
    action: Action,
    currentState: State,
    previousHistory: StateWithHistory<State>
  ) => any

  export const ActionCreators: {
    undo: () => Action,
    redo: () => Action,
    jump: (point: number) => Action,
    jumpToPast: (index: number) => Action,
    jumpToFuture: (index: number) => Action,
    clearHistory: () => Action
  }

  export const ActionTypes: {
    UNDO: string,
    REDO: string,
    JUMP: string,
    JUMP_TO_PAST: string,
    JUMP_TO_FUTURE: string,
    CLEAR_HISTORY: string
  }

  export interface UndoableOptions<State> {
    /** Set a limit for the history length */
    limit?: number

    /** If you don't want to include every action in the undo/redo history, you can add a filter function to undoable */
    filter?: FilterFunction<State>

    /** Groups actions together into one undo step */
    groupBy?: GroupByFunction<State>

    /** Define a custom action type for this undo action */
    undoType?: string

    /** Define a custom action type for this redo action */
    redoType?: string

    /** Define custom action type for this jump action */
    jumpType?: string

    /** Define custom action type for this jumpToPast action */
    jumpToPastType?: string

    /** Define custom action type for this jumpToFuture action */
    jumpToFutureType?: string

    /** Define custom action type(s) for this clearHistory action */
    clearHistoryType?: string | string[]

    /** History will be (re)set upon init action type */
    initTypes?: string | string[]

    /** Set to `true` to turn on debugging */
    debug?: boolean

    /** Set to `true` to prevent undoable from skipping the reducer on undo/redo **/
    neverSkipReducer?: boolean

    /** Set to `true` to prevent the user from undoing to the initial state  **/
    ignoreInitialState?: boolean

    /** Set to `true` to synchronize the _latestUnfiltered state with present when an excluded action is dispatched **/
    syncFilter?: boolean
  }

  /**
   * If you don't want to include every action in the undo/redo history, you can add a filter function to undoable.
   * redux-undo provides you with the includeAction and excludeAction helpers for basic filtering.
   */
  export const includeAction: <State>(actions: string | string[]) => FilterFunction<State>

  /**
   * If you don't want to include every action in the undo/redo history, you can add a filter function to undoable.
   * redux-undo provides you with the includeAction and excludeAction helpers for basic filtering.
   */
  export const excludeAction: <State>(actions: string | string[]) => FilterFunction<State>

  /**
   * Combine multiple filters into one function. If one filter returns false, then combineFilters() returns
   * false excluding that action from history.
   */
  export const combineFilters: <State>(...filters: FilterFunction<State>[]) => FilterFunction<State>

  /**
   * A basic convenience function for grouping the same action into a single undo/redo step. Useful for
   * similar, rapidly dispatched actions, e.g. "UPDATE_MOUSE_POSITION".
   */
  export const groupByActionTypes: <State>(actions: string | string[]) => GroupByFunction<State>

  /**
   * Create a new redux-undo history for an initial state. Alternatively, you can pass an initial
   * state normally and allow redux-undo to handle setup for you.
   */
  export const newHistory: <State>(
    past: State[],
    present: State,
    future: State[],
    group?: any
  ) => StateWithHistory<State>

  /**
   * Wrapping the state with undoable() allows you to dispatch actions that
   * can change your state to a previous version and back again.
   */
  export default function undoable<State, A extends Action = AnyAction> (
    reducer: Reducer<State, A>,
    options?: UndoableOptions<State>
  ): Reducer<StateWithHistory<State>>
}

export = ReduxUndo

// For UMD builds
export as namespace ReduxUndo
