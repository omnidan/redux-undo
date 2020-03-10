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
  export type ExtensionFunction<E = any, S = any, A extends Action = AnyAction> = (config: UndoableOptions<S, A>) =>
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

  export interface UndoableOptions<S = any, A extends Action = AnyAction, E = any> {
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

  interface Undoable {
    <S = any, A extends Action = AnyAction, E = any>(reducer: Reducer<S, A>, options?: UndoableOptions<S, A, E>): Reducer<StateWithHistory<S> & E, A>;
    <S = any, A extends Action = AnyAction>(reducer: Reducer<S, A>, options?: UndoableOptions<S, A>): Reducer<StateWithHistory<S>, A>;
  }

  const undoable: Undoable;

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
  export const combineExtensions: <S = any, A extends Action = AnyAction, E = any>(...extensions: ExtensionFunction<Partial<E>, S, A>[]) =>
    ExtensionFunction<E, S, A>;

  /**
   * The flattenState() field extension allows the user to access fields normally like
   * `state.field` instead of `state.present.field`.
   */
  export const flattenState: <S = any, A extends Action = AnyAction>() => ExtensionFunction<S, StateWithHistory<S>, A>;

  interface ActionFieldOptions<IM extends 'inline' | 'actionType' | 'action'> {
    insertMethod: IM,
    includeAction: (action: Action) => boolean
  }

  /**
   * The actionField() field extension allows users to insert the last occuring action
   * into their state.
   */
  interface ActionField {
    <S = any, A extends Action = AnyAction>(config: ActionFieldOptions<'actionType'>):
      ExtensionFunction<{ actionType: string }, S, A>;
    <S = any, A extends Action = AnyAction>(config: ActionFieldOptions<'action'>):
      ExtensionFunction<{ action: Action }, S, A>;
    <S = any, A extends Action = AnyAction>(config: ActionFieldOptions<'inline'>):
      ExtensionFunction<{ present: S & { action: Action } }, S, A>;
  }
  export const actionField: ActionField;

}
