import { Reducer, Action } from 'redux';

module 'redux-undo' {
  export interface StateWithHistory<State> {
    past: State[];
    present: State;
    future: State[];
  }

  export type FilterFunction = (action: Action) => boolean;
  export type CombineFilters = (...filters: FilterFunction[]) => FilterFunction;

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
  }

  interface Undoable {
    <State>(reducer: Reducer<State>, options?: Options): Reducer<StateWithHistory<State>>;
  }


  type IncludeAction = (actions: string | string[]) => FilterFunction;
  type ExcludeAction = typeof IncludeAction;

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
