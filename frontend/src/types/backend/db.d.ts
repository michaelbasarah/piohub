import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { InsertUser } from "./schema";
type Db = PgDatabase<PgQueryResultHKT>;
export declare let db: Db;
export declare function setDb(next: Db): void;
export declare function upsertUser(user: InsertUser): Promise<void>;
export declare function getUserByClerkId(clerkId: string): Promise<{
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
}>;
export declare function getUserById(id: number): Promise<{
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
}>;
export declare function updateUserProfile(userId: number, data: {
    university?: string | null;
    skills?: string | null;
    portfolioLink?: string | null;
    bio?: string | null;
    name?: string | null;
}): Promise<void>;
export declare function createProject(data: {
    ownerId: number;
    title: string;
    description: string;
    neededRoles: string[];
    maxTeamSize: number;
}): Promise<number>;
export declare function listOpenProjects(): Promise<{
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
}[]>;
export declare function getProjectById(id: number): Promise<{
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
} | undefined>;
export declare function getProjectsByOwner(ownerId: number): Promise<{
    neededRoles: string[];
    id: number;
    ownerId: number;
    title: string;
    description: string;
    maxTeamSize: number;
    status: "open" | "closed";
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getJoinedProjects(userId: number): Promise<{
    neededRoles: string[];
    id: number;
    ownerId: number;
    title: string;
    description: string;
    maxTeamSize: number;
    status: "open" | "closed";
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function createJoinRequest(data: {
    projectId: number;
    requesterId: number;
    message?: string;
}): Promise<number>;
export declare function getJoinRequestById(requestId: number): Promise<{
    id: number;
    projectId: number;
    requesterId: number;
    message: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function getExistingRequest(projectId: number, requesterId: number): Promise<{
    id: number;
    projectId: number;
    requesterId: number;
    message: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function getPendingRequestsForProject(projectId: number): Promise<{
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
}[]>;
export declare function getPendingRequestsForOwner(ownerId: number): Promise<{
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
}[]>;
export declare function respondToJoinRequest(requestId: number, ownerId: number, status: "approved" | "rejected"): Promise<void>;
export declare function getUserJoinRequestStatuses(userId: number): Promise<{
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
}[]>;
export declare function updateProjectStatus(projectId: number, ownerId: number, status: "open" | "closed"): Promise<void>;
export declare function updateProject(projectId: number, ownerId: number, data: {
    title: string;
    description: string;
    neededRoles: string[];
    maxTeamSize: number;
}): Promise<void>;
export declare function deleteProject(projectId: number, ownerId: number): Promise<void>;
export declare function getWorkspaceLinks(projectId: number): Promise<{
    addedByName: string;
    id: number;
    projectId: number;
    addedByUserId: number;
    label: string;
    url: string;
    createdAt: Date;
}[]>;
export declare function addWorkspaceLink(projectId: number, addedByUserId: number, label: string, url: string): Promise<void>;
export declare function deleteWorkspaceLink(linkId: number, userId: number): Promise<void>;
export declare function getPublicProfile(userId: number): Promise<{
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
    skills: string | null;
    portfolioLink: string | null;
    bio: string | null;
    createdAt: Date;
} | null>;
export declare function createOutreachContact(data: {
    name: string;
    channel?: string | null;
    note?: string | null;
    hasIdea: boolean;
}): Promise<number>;
export declare function listOutreachContacts(): Promise<{
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
}[]>;
export declare function deleteOutreachContact(id: number): Promise<void>;
export declare function attributeOutreachSignup(refCode: string, userId: number): Promise<{
    matched: boolean;
}>;
export declare function getAdminAnalytics(): Promise<{
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
}>;
export {};
