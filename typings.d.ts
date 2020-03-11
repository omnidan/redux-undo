declare module 'redux-undo' {
  import { Reducer, Action, AnyAction } from 'redux';

  export interface StateWithHistory<State> {
    past: State[];
    present: State;
    future: State[];
    _latestUnfiltered?: State;
    group?: any;
    index?: number;
    limit?: number;
  }

  export type FilterFunction<S = any, A extends Action = AnyAction> = (action: A, currentState: S, previousHistory: StateWithHistory<S>) => boolean;
  export type GroupByFunction<S = any, A extends Action = AnyAction> = (action: A, currentState: S, previousHistory: StateWithHistory<S>) => any;
  export type ExtensionFunction<E = {}, S = any, A extends Action = AnyAction> = (config: UndoableOptions<S, A, E>) =>
    (state: StateWithHistory<S>, action: A) => StateWithHistory<S> & E;

  export class ActionCreators {
    static undo: () => Action;
    static redo: () => Action;
    static jump: (point: number) => Action;
    static jumpToPast: (index: number) => Action;
    static jumpToFuture: (index: number) => Action;
    static clearHistory: () => Action;
  }

  export class ActionTypes {
    static UNDO: string;
    static REDO: string;
    static JUMP: string;
    static JUMP_TO_PAST: string;
    static JUMP_TO_FUTURE: string;
    static CLEAR_HISTORY: string;
  }

  export interface UndoableOptions<S = any, A extends Action = AnyAction, E = {}> {
    /* Set a limit for the history */
    limit?: number;

    /** If you don't want to include every action in the undo/redo history, you can add a filter function to undoable */
    filter?: FilterFunction<S, A>;

    /** Groups actions together into one undo step */
    groupBy?: GroupByFunction<S, A>;

    /** Define a custom action type for this undo action */
    undoType?: string;
    /** Define a custom action type for this redo action */
    redoType?: string;

    /** Define custom action type for this jump action */
    jumpType?: string;

    /** Define custom action type for this jumpToPast action */
    jumpToPastType?: string;
    /** Define custom action type for this jumpToFuture action */
    jumpToFutureType?: string;

    /** Define custom action type for this clearHistory action */
    clearHistoryType?: string | string[];

    /** History will be (re)set upon init action type */
    initTypes?: string[];

    /** Set to `true` to turn on debugging */
    debug?: boolean;

    /** Set to `true` to prevent undoable from skipping the reducer on undo/redo **/
    neverSkipReducer?: boolean;

    /** Set to `true` to prevent the user from undoing to the initial state  **/
    ignoreInitialState?: boolean;

    /** Set to `true` to synchronize the _latestUnfiltered state with present wen a excluded action is dispatched **/
    syncFilter?: boolean;

    /** Use extensions like flattenState or actionField to add extra fields to the state */
    extension?: ExtensionFunction<E, S, A>;

    /** Set to `true` to disable extension warnings */
    disableWarnings?: boolean;
  }

  const undoable: <S = any, A extends Action = AnyAction, E = {}>(reducer: Reducer<S, A>, options?: UndoableOptions<S, A, E>) => Reducer<StateWithHistory<S> & E, A>;

  export default undoable;

  /**
   * If you don't want to include every action in the undo/redo history, you can add a filter function to undoable.
   * redux-undo provides you with the includeAction and excludeAction helpers for basic filtering.
   */
  export const includeAction: <S = any, A extends Action = AnyAction>(actions: A['type'] | A['type'][]) => FilterFunction<S, A>;

  /**
   * If you don't want to include every action in the undo/redo history, you can add a filter function to undoable.
   * redux-undo provides you with the includeAction and excludeAction helpers for basic filtering.
   */
  export const excludeAction: <S = any, A extends Action = AnyAction>(actions: A['type'] | A['type'][]) => FilterFunction<S, A>;

  /**
   * Combine multiple filters into one function. If one filter returns false, then combineFilters() returns
   * false excluding that action from history.
   */
  export const combineFilters: <S = any, A extends Action = AnyAction>(...filters: FilterFunction<S, A>[]) => FilterFunction<S, A>;

  /**
   * @deprecated use `typeof conbineFilters`
   */
  export type CombineFilters = typeof combineFilters;

  /**
   * A basic convenience function for grouping the same action into a single undo/redo step. Useful for
   * similar, rapidly dispatched actions, e.g. "UPDATE_MOUSE_POSITION".
   */
  export const groupByActionTypes: <S = any, A extends Action = AnyAction>(actions: A['type'] | A['type'][]) => GroupByFunction<S, A>;

  /**
   * Create a new redux-undo history for an initial state. Alternatively, you can pass an initial
   * state normally and allow redux-undo to handle setup for you.
   */
  export const newHistory: <S>(past: S[], present: S, future: S[], group?: any) => StateWithHistory<S>;

  /**
   * Combine multiple filters into one function. If one filter returns false, then combineFilters() returns
   * false excluding that action from history.
   */
  export const combineExtensions: {
    // Atm, this is the only other way to do this without ugly conditional recursion
    <S = any, A extends Action = AnyAction, E1 = {}, E2 = {}>(
      extension1: ExtensionFunction<E1, S, A>,
      extension2?: ExtensionFunction<E2, S, A>
    ): ExtensionFunction<E1 & E2, S, A>;

    <S = any, A extends Action = AnyAction, E1 = {}, E2 = {}, E3 = {}>(
      extension1: ExtensionFunction<E1, S, A>,
      extension2: ExtensionFunction<E2, S, A>,
      extension3: ExtensionFunction<E3, S, A>
    ): ExtensionFunction<E1 & E2 & E3, S, A>;

    <S = any, A extends Action = AnyAction, E1 = {}, E2 = {}, E3 = {}, E4 = {}>(
      extension1: ExtensionFunction<E1, S, A>,
      extension2: ExtensionFunction<E2, S, A>,
      extension3: ExtensionFunction<E3, S, A>,
      extension4: ExtensionFunction<E4, S, A>
    ): ExtensionFunction<E1 & E2 & E3 & E4, S, A>;
  }

  /**
   * The flattenState() field extension allows the user to access fields normally like
   * `state.field` instead of `state.present.field`.
   */
  export const flattenState: <S = {}, A extends Action = AnyAction>() => ExtensionFunction<S, S, A>;

  interface ActionFieldOptions<IM extends 'inline' | 'actionType' | 'action', A> {
    insertMethod?: IM,
    includeAction?: (action: A) => boolean
  }

  interface ActionField {
    <S = any, A extends Action = AnyAction>(config: ActionFieldOptions<'actionType', A>):
      ExtensionFunction<{ actionType: A['type'] }, S, A>;
    <S = any, A extends Action = AnyAction>(config: ActionFieldOptions<'action', A>):
      ExtensionFunction<{ action: A }, S, A>;
    <S = any, A extends Action = AnyAction>(config: ActionFieldOptions<'inline', A>):
      ExtensionFunction<{ present: S & { action: A } }, S, A>;
  }

  /**
   * The actionField() field extension allows users to insert the last occuring
   * action into your state.
   */
  export const actionField: ActionField;

}
