import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createJoinRequest,
  createProject,
  deleteProject,
  deleteWorkspaceLink,
  addWorkspaceLink,
  getExistingRequest,
  getJoinedProjects,
  getPublicProfile,
  getPendingRequestsForOwner,
  getPendingRequestsForProject,
  getProjectById,
  getProjectsByOwner,
  getUserById,
  getUserJoinRequestStatuses,
  getWorkspaceLinks,
  listOpenProjects,
  respondToJoinRequest,
  updateProject,
  updateProjectStatus,
  updateUserProfile,
  getJoinRequestById,
  getAdminAnalytics,
  createOutreachContact,
  listOutreachContacts,
  deleteOutreachContact,
  attributeOutreachSignup,
} from "./db";
import {
  sendEmail,
  generateJoinRequestEmailHtml,
  generateApprovalEmailHtml,
  generateRejectionEmailHtml,
} from "./email";
import { ENV } from "./env";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./trpc";

// z.string().url() alone accepts `javascript:alert(1)` (anything new URL() parses),
// and these links are rendered as <a href>. Only allow http(s).
const httpUrl = (max: number) =>
  z
    .string()
    .max(max)
    .url()
    .refine((u) => /^https?:\/\//i.test(u), { message: "Link must start with http:// or https://" });

export const appRouter = router({
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100).optional(),
          university: z.string().max(255).optional().nullable(),
          skills: z.array(z.string().max(50)).max(20).optional(),
          portfolioLink: httpUrl(512).optional().nullable().or(z.literal("")),
          bio: z.string().max(500).optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, {
          name: input.name,
          university: input.university,
          skills: input.skills ? JSON.stringify(input.skills) : undefined,
          portfolioLink: input.portfolioLink,
          bio: input.bio,
        });
        return { success: true };
      }),

    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await getUserById(input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        // Public endpoint — only return public-safe fields
        return {
          id: user.id,
          name: user.name,
          university: user.university,
          portfolioLink: user.portfolioLink,
          bio: user.bio,
          createdAt: user.createdAt,
          skills: user.skills ? (JSON.parse(user.skills) as string[]) : [],
        };
      }),
  }),

  projects: router({
    list: publicProcedure.query(async () => {
      return listOpenProjects();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const project = await getProjectById(input.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        return project;
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(3).max(255),
          description: z.string().min(10).max(5000),
          neededRoles: z.array(z.string().max(50)).min(1).max(10),
          maxTeamSize: z.number().int().min(2).max(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createProject({
          ownerId: ctx.user.id,
          title: input.title,
          description: input.description,
          neededRoles: input.neededRoles,
          maxTeamSize: input.maxTeamSize,
        });
        return { id };
      }),

    close: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await updateProjectStatus(input.id, ctx.user.id, "closed");
        return { success: true };
      }),

    reopen: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await updateProjectStatus(input.id, ctx.user.id, "open");
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(3).max(255),
          description: z.string().min(10).max(5000),
          neededRoles: z.array(z.string().max(50)).min(1).max(10),
          maxTeamSize: z.number().int().min(2).max(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateProject(input.id, ctx.user.id, {
          title: input.title,
          description: input.description,
          neededRoles: input.neededRoles,
          maxTeamSize: input.maxTeamSize,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  joinRequests: router({
    request: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          message: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        if (project.ownerId === ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot request to join your own project",
          });
        }

        const isMember = project.members.some((m) => m.id === ctx.user.id);
        if (isMember) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You are already a member of this project",
          });
        }

        const existing = await getExistingRequest(input.projectId, ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You have already requested to join this project",
          });
        }

        const id = await createJoinRequest({
          projectId: input.projectId,
          requesterId: ctx.user.id,
          message: input.message,
        });

        // Email the project owner
        const owner = await getUserById(project.ownerId);
        if (owner?.email) {
          await sendEmail({
            to: owner.email,
            subject: `New join request for "${project.title}"`,
            html: generateJoinRequestEmailHtml(
              ctx.user.name ?? "Someone",
              project.title,
              `${ENV.frontendUrl}/dashboard`
            ),
          });
        }

        return { id };
      }),

    listForProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        if (project.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getPendingRequestsForProject(input.projectId);
      }),

    respond: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          status: z.enum(["approved", "rejected"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get request details before responding (for email)
        const joinRequest = await getJoinRequestById(input.requestId);

        await respondToJoinRequest(input.requestId, ctx.user.id, input.status);

        // Email the requester
        if (joinRequest) {
          const requester = await getUserById(joinRequest.requesterId);
          const project = await getProjectById(joinRequest.projectId);

          if (requester?.email && project) {
            if (input.status === "approved") {
              await sendEmail({
                to: requester.email,
                subject: `You've been approved to join "${project.title}"`,
                html: generateApprovalEmailHtml(
                  project.title,
                  `${ENV.frontendUrl}/projects/${project.id}`
                ),
              });
            } else {
              await sendEmail({
                to: requester.email,
                subject: `Update on your request to join "${project.title}"`,
                html: generateRejectionEmailHtml(project.title),
              });
            }
          }
        }

        return { success: true };
      }),

    myStatuses: protectedProcedure.query(async ({ ctx }) => {
      return getUserJoinRequestStatuses(ctx.user.id);
    }),
  }),

  dashboard: router({
    myData: protectedProcedure.query(async ({ ctx }) => {
      const [ownedProjects, joinedProjects, pendingRequests] = await Promise.all([
        getProjectsByOwner(ctx.user.id),
        getJoinedProjects(ctx.user.id),
        getPendingRequestsForOwner(ctx.user.id),
      ]);
      const user = {
        ...ctx.user,
        skills: ctx.user.skills ? (JSON.parse(ctx.user.skills) as string[]) : [],
      };
      return { ownedProjects, joinedProjects, pendingRequests, user };
    }),
  }),

  profile: router({
    getPublic: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getPublicProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          ...profile,
          skills: profile.skills ? (JSON.parse(profile.skills) as string[]) : [],
        };
      }),
  }),

  admin: router({
    overview: adminProcedure.query(async () => {
      return getAdminAnalytics();
    }),

    outreach: router({
      list: adminProcedure.query(async () => {
        return listOutreachContacts();
      }),

      add: adminProcedure
        .input(
          z.object({
            name: z.string().min(1).max(255),
            channel: z.string().max(50).optional(),
            note: z.string().max(500).optional(),
            hasIdea: z.boolean().default(false),
          })
        )
        .mutation(async ({ input }) => {
          const id = await createOutreachContact(input);
          return { id };
        }),

      remove: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteOutreachContact(input.id);
          return { success: true };
        }),
    }),
  }),

  outreach: router({
    // Any signed-in user can claim a ref code — links them to the contact we
    // gave that code to. Guarded server-side (already-claimed codes are ignored).
    attribute: protectedProcedure
      .input(z.object({ refCode: z.string().min(1).max(16) }))
      .mutation(async ({ ctx, input }) => {
        return attributeOutreachSignup(input.refCode, ctx.user.id);
      }),
  }),

  workspace: router({
    getLinks: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        const isMember = project.members.some((m) => m.id === ctx.user.id);
        const isOwner = project.ownerId === ctx.user.id;
        if (!isMember && !isOwner) throw new TRPCError({ code: "FORBIDDEN" });
        return getWorkspaceLinks(input.projectId);
      }),

    addLink: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          label: z.string().min(1).max(255),
          url: httpUrl(2048),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addWorkspaceLink(input.projectId, ctx.user.id, input.label, input.url);
        return { success: true };
      }),

    deleteLink: protectedProcedure
      .input(z.object({ linkId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteWorkspaceLink(input.linkId, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
