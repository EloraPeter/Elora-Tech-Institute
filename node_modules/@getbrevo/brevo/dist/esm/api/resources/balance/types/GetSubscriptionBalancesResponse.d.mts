export interface GetSubscriptionBalancesResponse {
    balance?: GetSubscriptionBalancesResponse.Balance.Item[] | undefined;
}
export declare namespace GetSubscriptionBalancesResponse {
    type Balance = Balance.Item[];
    namespace Balance {
        interface Item {
            /** balance definition ID */
            balanceDefinitionId?: string | undefined;
            /** Unique identifier for the balance definition associated with this aggregate balance */
            value?: number | undefined;
        }
    }
}
