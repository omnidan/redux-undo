declare module 'redux-undo' {
  import { Reducer, Action } from 'redux';

  export interface StateWithHistory<State> {
    past: State[];
    present: State;
    future: State[];
  }

  export type FilterFunction = (action: Action) => boolean;
  export type CombineFilters = (...filters: FilterFunction[]) => FilterFunction;

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

  interface Options {
    /* Set a limit for the history */
    limit?: number;

    /** If you don't want to include every action in the undo/redo history, you can add a filter function to undoable */
    filter?: FilterFunction;

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

    /** [beta only] Define custom action type for this clearHistory action */
    clearHistoryType?: string;

    /** History will be (re)set upon init action type */
    initTypes?: string[];

    /** Set to `true` to turn on debugging */
    debug?: boolean;
    
    /** Set to `true` to prevent undoable from skipping the reducer on undo/redo **/
    neverSkipReducer?: boolean;
  }

  interface Undoable {
    <State>(reducer: Reducer<State>, options?: Options): Reducer<StateWithHistory<State>>;
  }


  type IncludeAction = (actions: string | string[]) => FilterFunction;
  type ExcludeAction = IncludeAction;

  const undoable: Undoable;

  export default undoable;

  /**
   * If you don't want to include every action in the undo/redo history, you can add a filter function to undoable.
   * redux-undo provides you with the includeAction and excludeAction helpers for basic filtering.
   */
  export const includeAction: IncludeAction;

  /**
   * If you don't want to include every action in the undo/redo history, you can add a filter function to undoable.
   * redux-undo provides you with the includeAction and excludeAction helpers for basic filtering.
   */
  export const excludeAction: ExcludeAction;

  export const combineFilters: CombineFilters;
}
