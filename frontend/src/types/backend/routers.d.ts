export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("./trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        me: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                role: "user" | "admin";
                id: number;
                clerkId: string;
                name: string | null;
                email: string | null;
                university: string | null;
                skills: string | null;
                portfolioLink: string | null;
                bio: string | null;
                createdAt: Date;
                updatedAt: Date;
                lastSignedIn: Date;
            } | null;
            meta: object;
        }>;
        updateProfile: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name?: string | undefined;
                university?: string | null | undefined;
                skills?: string[] | undefined;
                portfolioLink?: string | null | undefined;
                bio?: string | null | undefined;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        getProfile: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: number;
            };
            output: {
                id: number;
                name: string | null;
                university: string | null;
                portfolioLink: string | null;
                bio: string | null;
                createdAt: Date;
                skills: string[];
            };
            meta: object;
        }>;
    }>>;
    projects: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                neededRoles: string[];
                owner: {
                    id: number;
                    name: string | null;
                    university: string | null;
                    skills: string | null;
                    portfolioLink: string | null;
                    bio: string | null;
                    createdAt: Date;
                } | null;
                memberCount: number;
                id: number;
                ownerId: number;
                title: string;
                description: string;
                maxTeamSize: number;
                status: "open" | "closed";
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: number;
            };
            output: {
                neededRoles: string[];
                owner: {
                    id: number;
                    name: string | null;
                    university: string | null;
                    skills: string | null;
                    portfolioLink: string | null;
                    bio: string | null;
                    createdAt: Date;
                };
                members: {
                    id: number;
                    name: string | null;
                    university: string | null;
                    skills: string | null;
                    portfolioLink: string | null;
                    bio: string | null;
                    createdAt: Date;
                }[];
                memberCount: number;
                id: number;
                ownerId: number;
                title: string;
                description: string;
                maxTeamSize: number;
                status: "open" | "closed";
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                title: string;
                description: string;
                neededRoles: string[];
                maxTeamSize: number;
            };
            output: {
                id: number;
            };
            meta: object;
        }>;
        close: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        reopen: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
                title: string;
                description: string;
                neededRoles: string[];
                maxTeamSize: number;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    joinRequests: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        request: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                projectId: number;
                message?: string | undefined;
            };
            output: {
                id: number;
            };
            meta: object;
        }>;
        listForProject: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                projectId: number;
            };
            output: {
                requester: {
                    id: number;
                    clerkId: string;
                    name: string | null;
                    email: string | null;
                    role: "user" | "admin";
                    university: string | null;
                    skills: string | null;
                    portfolioLink: string | null;
                    bio: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    lastSignedIn: Date;
                } | null;
                id: number;
                projectId: number;
                requesterId: number;
                message: string | null;
                status: "pending" | "approved" | "rejected";
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        respond: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                status: "approved" | "rejected";
                requestId: number;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        myStatuses: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                project: {
                    id: number;
                    ownerId: number;
                    title: string;
                    description: string;
                    neededRoles: string;
                    maxTeamSize: number;
                    status: "open" | "closed";
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                id: number;
                projectId: number;
                requesterId: number;
                message: string | null;
                status: "pending" | "approved" | "rejected";
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
    }>>;
    dashboard: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        myData: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                ownedProjects: {
                    neededRoles: string[];
                    id: number;
                    ownerId: number;
                    title: string;
                    description: string;
                    maxTeamSize: number;
                    status: "open" | "closed";
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                joinedProjects: {
                    neededRoles: string[];
                    id: number;
                    ownerId: number;
                    title: string;
                    description: string;
                    maxTeamSize: number;
                    status: "open" | "closed";
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                pendingRequests: {
                    requester: {
                        id: number;
                        clerkId: string;
                        name: string | null;
                        email: string | null;
                        role: "user" | "admin";
                        university: string | null;
                        skills: string | null;
                        portfolioLink: string | null;
                        bio: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        lastSignedIn: Date;
                    } | null;
                    project: {
                        id: number;
                        ownerId: number;
                        title: string;
                        description: string;
                        neededRoles: string;
                        maxTeamSize: number;
                        status: "open" | "closed";
                        createdAt: Date;
                        updatedAt: Date;
                    } | null;
                    id: number;
                    projectId: number;
                    requesterId: number;
                    message: string | null;
                    status: "pending" | "approved" | "rejected";
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                user: {
                    skills: string[];
                    role: "user" | "admin";
                    id: number;
                    clerkId: string;
                    name: string | null;
                    email: string | null;
                    university: string | null;
                    portfolioLink: string | null;
                    bio: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    lastSignedIn: Date;
                };
            };
            meta: object;
        }>;
    }>>;
    profile: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getPublic: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: number;
            };
            output: {
                skills: string[];
                ownedProjects: {
                    id: number;
                    ownerId: number;
                    title: string;
                    description: string;
                    neededRoles: string;
                    maxTeamSize: number;
                    status: "open" | "closed";
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                joinedProjects: {
                    id: number;
                    ownerId: number;
                    title: string;
                    description: string;
                    neededRoles: string;
                    maxTeamSize: number;
                    status: "open" | "closed";
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                id: number;
                name: string | null;
                university: string | null;
                portfolioLink: string | null;
                bio: string | null;
                createdAt: Date;
            };
            meta: object;
        }>;
    }>>;
    admin: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        overview: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                generatedAt: string;
                totals: {
                    users: number;
                    projects: number;
                    openProjects: number;
                    closedProjects: number;
                    teamsFormed: number;
                    joinRequests: number;
                    workspaceLinks: number;
                };
                growth: {
                    signupsThisWeek: number;
                    signupsPrevWeek: number;
                    projectsThisWeek: number;
                    projectsPrevWeek: number;
                    requestsThisWeek: number;
                    signupsByDay: {
                        date: string;
                        count: number;
                    }[];
                    projectsByDay: {
                        date: string;
                        count: number;
                    }[];
                };
                activation: {
                    activatedUsers: number;
                    activationRate: number;
                    profileCompleted: number;
                    profileCompletionRate: number;
                    lurkers: number;
                };
                loop: {
                    projectsWithRequests: number;
                    projectsWithRequestsRate: number;
                    pending: number;
                    approved: number;
                    rejected: number;
                    responded: number;
                    responseRate: number;
                    approvalRate: number;
                    avgResponseHours: number | null;
                    avgTimeToFirstTeammateHours: number | null;
                };
                engagement: {
                    active7: number;
                    active30: number;
                    teamsWithWorkspace: number;
                };
                marketplace: {
                    owners: number;
                    joiners: number;
                    ownerToJoinerRatio: number | null;
                    openRecruiting: number;
                    openSpots: number;
                    avgFillRate: number;
                };
                quality: {
                    universityBreakdown: {
                        university: string;
                        count: number;
                    }[];
                    topRoles: {
                        role: string;
                        count: number;
                    }[];
                };
            };
            meta: object;
        }>;
        outreach: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("./trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    signedUp: boolean;
                    posted: boolean;
                    id: number;
                    name: string;
                    channel: string | null;
                    note: string | null;
                    hasIdea: boolean;
                    refCode: string;
                    signedUpUserId: number | null;
                    createdAt: Date;
                }[];
                meta: object;
            }>;
            add: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    channel?: string | undefined;
                    note?: string | undefined;
                    hasIdea?: boolean | undefined;
                };
                output: {
                    id: number;
                };
                meta: object;
            }>;
            remove: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: number;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
        }>>;
    }>>;
    outreach: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        attribute: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                refCode: string;
            };
            output: {
                matched: boolean;
            };
            meta: object;
        }>;
    }>>;
    workspace: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getLinks: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                projectId: number;
            };
            output: {
                addedByName: string;
                id: number;
                projectId: number;
                addedByUserId: number;
                label: string;
                url: string;
                createdAt: Date;
            }[];
            meta: object;
        }>;
        addLink: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                projectId: number;
                label: string;
                url: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        deleteLink: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                linkId: number;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
}>>;
export type AppRouter = typeof appRouter;
