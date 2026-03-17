export interface TierGroup {
    /** Timestamp when the tier group was created */
    createdAt?: string | undefined;
    /** Select real_time to downgrade tier on real time balance updates. Select membership_anniversary to downgrade tier on subscription anniversary. Select tier_anniversary to downgrade tier on tier anniversary. */
    downgradeStrategy?: TierGroup.DowngradeStrategy | undefined;
    /** Tier group unique identifier */
    id?: string | undefined;
    /** Associated loyalty program Id */
    loyaltyProgramId?: string | undefined;
    /** Tier group name */
    name?: string | undefined;
    /** Order of the tiers in the group in ascending order */
    tierOrder?: string[] | undefined;
    /** Timestamp when the tier group was last updated */
    updatedAt?: string | undefined;
    /** Select real_time to upgrade tier on real time balance updates. Select membership_anniversary to upgrade tier on subscription anniversary. Select tier_anniversary to upgrade tier on tier anniversary. */
    upgradeStrategy?: TierGroup.UpgradeStrategy | undefined;
}
export declare namespace TierGroup {
    /** Select real_time to downgrade tier on real time balance updates. Select membership_anniversary to downgrade tier on subscription anniversary. Select tier_anniversary to downgrade tier on tier anniversary. */
    const DowngradeStrategy: {
        readonly RealTime: "real_time";
        readonly MembershipAnniversary: "membership_anniversary";
        readonly TierAnniversary: "tier_anniversary";
    };
    type DowngradeStrategy = (typeof DowngradeStrategy)[keyof typeof DowngradeStrategy];
    /** Select real_time to upgrade tier on real time balance updates. Select membership_anniversary to upgrade tier on subscription anniversary. Select tier_anniversary to upgrade tier on tier anniversary. */
    const UpgradeStrategy: {
        readonly RealTime: "real_time";
        readonly MembershipAnniversary: "membership_anniversary";
        readonly TierAnniversary: "tier_anniversary";
    };
    type UpgradeStrategy = (typeof UpgradeStrategy)[keyof typeof UpgradeStrategy];
}
