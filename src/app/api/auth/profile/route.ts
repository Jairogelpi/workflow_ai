import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Ensures the user has a record in public.profiles and at least one project.
 * This is called by the extension after a successful Google Login.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Ensure Profile exists (Hito 4.1)
        // Note: In a production app, this would be a Postgres Trigger, 
        // but here we ensure consistency via API for the "Real Example".
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata.full_name,
                avatar_url: user.user_metadata.avatar_url,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (profileError) throw profileError;

        // 2. Ensure at least one project exists
        const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1);

        let defaultProject;
        if (!projects || projects.length === 0) {
            const { data: newProject, error: projectError } = await supabase
                .from('projects')
                .insert({
                    name: 'Mi Primer Grafo',
                    description: 'Espacio personal creado automáticamente por Axiom.',
                    owner_id: user.id
                })
                .select()
                .single();

            if (projectError) throw projectError;
            defaultProject = newProject;
        } else {
            defaultProject = projects[0];
        }

        return NextResponse.json({
            success: true,
            profile,
            defaultProjectId: defaultProject.id
        });

    } catch (error: any) {
        console.error('[API Auth Profile] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
