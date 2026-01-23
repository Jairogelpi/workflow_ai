import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Projects (Optimized for dropdown)
        // RLS ensures we only see owned projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name')
            .order('updated_at', { ascending: false });

        if (projectsError) throw projectsError;

        // Add CORS for Extension (matching ingest route)
        return NextResponse.json({ projects }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true'
            }
        });

    } catch (error: any) {
        console.error('[API User Projects] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        },
    });
}
