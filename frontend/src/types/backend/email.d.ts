export declare function escapeHtml(text: string): string;
interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean>;
export declare function generateJoinRequestEmailHtml(requesterName: string, projectTitle: string, dashboardUrl: string): string;
export declare function generateApprovalEmailHtml(projectTitle: string, projectUrl: string): string;
export declare function generateRejectionEmailHtml(projectTitle: string): string;
export {};
