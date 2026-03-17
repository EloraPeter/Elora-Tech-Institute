/**
 * List of stages
 */
export interface Pipeline {
    /** Pipeline id */
    pipeline?: string | undefined;
    /** Pipeline Name */
    pipeline_name?: string | undefined;
    /** List of stages */
    stages?: Pipeline.Stages.Item[] | undefined;
}
export declare namespace Pipeline {
    type Stages = Stages.Item[];
    namespace Stages {
        /**
         * List of stages
         */
        interface Item {
            /** Stage id */
            id?: string | undefined;
            /** Stage name */
            name?: string | undefined;
        }
    }
}
