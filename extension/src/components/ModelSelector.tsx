
export function ModelSelector() {
    return (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                Configuración de IA
            </h3>
            <div className="bg-white p-3 rounded-xl border border-slate-100/50 shadow-sm text-center">
                <p className="text-[11px] font-medium text-slate-500">
                    La extensión usa la configuración global de <br /> **Axiom Cloud** para simplificar tu flujo.
                </p>
            </div>
            <p className="text-[9px] text-slate-300 text-center font-bold uppercase tracking-wider">
                Modo Híbrido Activado
            </p>
        </div>
    );
}
