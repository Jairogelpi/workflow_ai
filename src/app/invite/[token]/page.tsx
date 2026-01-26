'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verificando invitación...');
    const router = useRouter();

    useEffect(() => {
        const acceptInvite = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setStatus('error');
                setMessage('Debes iniciar sesión para aceptar la invitación.');
                // Redirect logic could go here, or show a login button
                return;
            }

            try {
                // Call RPC
                const { data, error } = await supabase.rpc('accept_project_invitation', {
                    invite_token: params.token
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error);

                setStatus('success');
                setMessage('¡Te has unido al proyecto exitosamente!');

                // Redirect to project after delay
                setTimeout(() => {
                    router.push(`/project/${data.project_id}`);
                }, 2000);

            } catch (err: any) {
                console.error(err);
                if (err.message === 'ALREADY_MEMBER') {
                    setStatus('success'); // Soft success
                    setMessage('Ya eres miembro de este proyecto.');
                } else if (err.message === 'INVALID_OR_EXPIRED_TOKEN') {
                    setStatus('error');
                    setMessage('El enlace de invitación es inválido o ha expirado.');
                } else {
                    setStatus('error');
                    setMessage('Error al procesar la invitación.');
                }
            }
        };

        acceptInvite();
    }, [params.token, router]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-xl text-slate-100">
                        {status === 'verifying' && 'Procesando...'}
                        {status === 'success' && '¡Bienvenido!'}
                        {status === 'error' && 'Error'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                        {message}
                    </p>
                </CardContent>
                <CardFooter>
                    {status === 'error' && (
                        <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                            Volver al Inicio
                        </Button>
                    )}
                    {status === 'success' && (
                        <div className="w-full bg-blue-500/10 text-blue-400 text-xs py-2 px-3 rounded text-center">
                            Redirigiendo al espacio de trabajo...
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
