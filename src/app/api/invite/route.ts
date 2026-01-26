import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Secure backend only
);

export async function POST(req: Request) {
    try {
        const { projectId, email, role, invitedBy } = await req.json();

        // 1. Generate Secure Token
        const token = crypto.randomUUID();

        // 2. Store in DB
        const { error: dbError } = await supabase
            .from('project_invitations')
            .insert({
                project_id: projectId,
                email,
                role,
                token,
                invited_by: invitedBy
            });

        if (dbError) {
            // Handle unique constraint (already invited)
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'User already invited to this project.' }, { status: 409 });
            }
            throw dbError;
        }

        // 3. Send Email via Resend
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

        await resend.emails.send({
            from: 'WorkGraph OS <invites@axiom-os.com>', // User needs to verify domain or use onboarding@resend.dev
            to: email,
            subject: 'Invitación a colaborar en WorkGraph OS',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Has sido invitado a colaborar</h2>
                    <p>Un administrador te ha invitado al proyecto en <strong>WorkGraph OS</strong> con el rol de <strong>${role}</strong>.</p>
                    <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                        Aceptar Invitación
                    </a>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">
                        Este enlace expira en 7 días. Si no esperabas esto, puedes ignorar este correo.
                    </p>
                </div>
            `
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Invite API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
