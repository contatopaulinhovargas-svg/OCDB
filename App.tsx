
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Venue, GroupedVenues } from './types';
import { extractVenuesFromImage } from './services/geminiService';
import { VenueCard } from './components/VenueCard';
import { 
  Upload, 
  FileText, 
  Search, 
  Loader2, 
  Music,
  Map as MapIcon,
  X,
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  Instagram,
  Trash2,
  Eraser,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const App: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Normalização agressiva para garantir unicidade absoluta
  const normalizeForComparison = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]/g, "") // Mantém apenas alfanuméricos para comparação cega
      .replace(/\s+/g, ""); 
  };

  // Persistência de Dados
  useEffect(() => {
    const saved = localStorage.getItem('ocdb_official_db');
    if (saved) {
      try {
        setVenues(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar banco", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ocdb_official_db', JSON.stringify(venues));
  }, [venues]);

  // Função para limpar repetidas manualmente
  const handleRemoveDuplicates = () => {
    if (venues.length === 0) {
      alert("Seu banco de dados está vazio!");
      return;
    }

    const seen = new Set<string>();
    const uniqueList: Venue[] = [];
    
    venues.forEach(v => {
      const key = `${normalizeForComparison(v.name)}|${normalizeForComparison(v.city)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(v);
      }
    });

    const diff = venues.length - uniqueList.length;
    if (diff > 0) {
      if (window.confirm(`Encontramos ${diff} casa(s) com nomes repetidos na mesma cidade. Deseja unificar agora?`)) {
        setVenues(uniqueList);
        alert(`Sucesso! ${diff} registros duplicados foram removidos.`);
      }
    } else {
      alert("Nenhuma casa repetida encontrada. Seu banco está organizado!");
    }
  };

  // Upload com bloqueio automático de duplicatas
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const extracted = await extractVenuesFromImage(base64);
        
        const currentVenues = [...venues];
        const newValidEntries: Venue[] = [];
        let duplicateCount = 0;

        extracted.forEach(v => {
          if (!v.name || !v.city) return;

          // Chave de comparação: Nome + Cidade normalizados
          const searchKey = `${normalizeForComparison(v.name)}|${normalizeForComparison(v.city)}`;
          
          // Verifica se já existe no banco ou se já foi incluído neste loop
          const alreadyExists = currentVenues.some(cv => 
            `${normalizeForComparison(cv.name)}|${normalizeForComparison(cv.city)}` === searchKey
          ) || newValidEntries.some(nv => 
            `${normalizeForComparison(nv.name)}|${normalizeForComparison(nv.city)}` === searchKey
          );

          if (alreadyExists) {
            duplicateCount++;
            return;
          }

          newValidEntries.push({
            id: uuidv4(),
            name: v.name.trim(),
            city: v.city.trim(),
            ddd: v.ddd || '?',
            socialMedia: v.socialMedia || '',
            distanceKm: v.distanceKm || 0,
            travelTime: v.travelTime || '',
            createdAt: Date.now(),
            notes: ''
          });
        });

        if (newValidEntries.length > 0) {
          setVenues(prev => [...prev, ...newValidEntries]);
          if (duplicateCount > 0) {
            alert(`${newValidEntries.length} novas casas adicionadas. ${duplicateCount} casas repetidas foram ignoradas automaticamente.`);
          } else {
            alert(`${newValidEntries.length} novas casas adicionadas com sucesso!`);
          }
        } else if (duplicateCount > 0) {
          alert("Aviso: Todas as casas deste print já constam no seu banco de dados. Nenhuma duplicata foi criada.");
        }
      } catch (err) {
        console.error("Erro no processamento IA", err);
        alert("Erro ao analisar imagem. Tente um print mais nítido.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta casa de show da sua agenda?')) {
      setVenues(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenue) return;
    setVenues(prev => prev.map(v => v.id === editingVenue.id ? editingVenue : v));
    setEditingVenue(null);
    setIsModalOpen(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFontSize(16);
    doc.setTextColor(6, 182, 212);
    doc.text('OCDB - O CAMINHO DO BAILE', 14, 16);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Relatório Oficial Studio Voz - ${new Date().toLocaleDateString('pt-BR')}`, 14, 21);

    const data = [...venues].sort((a, b) => a.distanceKm - b.distanceKm).map(v => [
      v.name.toUpperCase(),
      v.city.toUpperCase(),
      v.ddd,
      `${v.distanceKm.toFixed(1)} KM`,
      v.travelTime || '-',
      v.socialMedia || '-'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['CASA DE SHOW', 'CIDADE', 'DDD', 'DISTÂNCIA', 'VIAGEM', 'INSTAGRAM']],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], fontSize: 8 },
      styles: { fontSize: 7 }
    });

    doc.save(`ocdb-agenda-${Date.now()}.pdf`);
  };

  const groupedVenues = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const filtered = venues.filter(v => 
      v.name.toLowerCase().includes(q) || 
      v.city.toLowerCase().includes(q) || 
      v.ddd.includes(q)
    );

    const groups: GroupedVenues = { '48': [], '47': [], '49': [], 'Outros': [] };
    filtered.forEach(v => {
      if (v.ddd === '48') groups['48'].push(v);
      else if (v.ddd === '47') groups['47'].push(v);
      else if (v.ddd === '49') groups['49'].push(v);
      else groups['Outros'].push(v);
    });

    Object.keys(groups).forEach(k => groups[k].sort((a, b) => a.distanceKm - b.distanceKm));
    return groups;
  }, [venues, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-cyan-500/40">
      {/* HEADER DE ALTA PERFORMANCE */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 shadow-2xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-2xl shadow-xl shadow-cyan-500/20 rotate-3">
              <Music className="text-white" size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none flex items-center gap-2">
                OCDB <span className="text-cyan-400 font-light not-italic text-lg">Oficial</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Paulinho Vargas Studio Voz</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[200px] lg:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all placeholder:text-slate-700 font-medium"
              />
            </div>

            <button 
              onClick={handleRemoveDuplicates}
              className="bg-slate-900 hover:bg-rose-900/30 text-rose-500 p-3 rounded-2xl border border-slate-800 transition-all flex items-center gap-2 px-5 text-[10px] font-black uppercase tracking-widest hover:border-rose-500/50"
              title="Limpar casas repetidas"
            >
              <Eraser size={18} />
              <span className="hidden sm:inline">Limpar Repetidas</span>
            </button>
            
            <label className="cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-2xl shadow-xl shadow-cyan-600/30 transition-all flex items-center gap-2 px-6 text-[10px] font-black uppercase tracking-widest active:scale-95">
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span>{isProcessing ? 'Deduplicando...' : 'Lançar Print'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isProcessing} />
            </label>

            <button onClick={() => setIsInstallModalOpen(true)} className="p-3 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-colors">
              <Download size={20} />
            </button>
            <button onClick={generatePDF} className="p-3 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-2xl hover:bg-emerald-600/30 transition-colors">
              <FileText size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-16 pb-48">
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-800 animate-pulse">
            <div className="relative mb-6">
              <Loader2 size={80} className="text-cyan-500 animate-spin" />
              <ShieldCheck size={32} className="text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Proteção de Dados Ativa</h2>
            <p className="text-slate-500 font-medium mt-2">Eliminando duplicatas e calculando rota do Rio Caveiras...</p>
          </div>
        )}

        {(Object.entries(groupedVenues) as [string, Venue[]][]).map(([ddd, items]) => {
          if (items.length === 0) return null;
          return (
            <section key={ddd} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-2 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
                  <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                      Região {ddd === 'Outros' ? 'Expandida' : ddd}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Pontos de Shows Mapeados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-cyan-500 text-[10px] font-black bg-cyan-500/10 px-6 py-2.5 rounded-xl border border-cyan-500/20 tracking-widest uppercase">
                    {items.length} locais únicos
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {items.map(v => (
                  <VenueCard 
                    key={v.id} 
                    venue={v} 
                    onDelete={handleDelete}
                    onEdit={(v) => { setEditingVenue(v); setIsModalOpen(true); }}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {venues.length === 0 && !isProcessing && (
          <div className="text-center py-40 bg-slate-900/10 rounded-[4rem] border border-slate-800 border-dashed">
            <div className="bg-slate-900 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-800 border border-slate-800 shadow-2xl">
              <MapIcon size={64} className="opacity-20 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 italic tracking-tighter uppercase">Banco de Dados Vazio</h3>
            <p className="text-slate-500 max-w-xs mx-auto font-medium leading-relaxed">
              O seu app oficial está pronto. Suba um print de agenda para começar a mapear o caminho do baile.
            </p>
          </div>
        )}
      </main>

      {/* FOOTER FIXO PREMIUM */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-3xl border-t border-slate-800/50 p-8 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex items-center gap-3 group">
              <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,1)] group-hover:scale-125 transition-transform"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-300">BANCO DE DADOS: {venues.length} CASAS ÚNICAS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,1)]"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-300">ROTA BASE: BIGUAÇU / SC</span>
            </div>
          </div>
          
          <div className="text-center md:text-right group">
            <p className="text-[13px] font-black tracking-[0.4em] text-cyan-500 uppercase transition-all group-hover:text-cyan-400">
              Criado por Paulinho Vargas Studio Voz
            </p>
            <p className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-[0.2em]">
              © {new Date().getFullYear()} OCDB • SISTEMA INTELIGENTE DE AGENDA
            </p>
          </div>
        </div>
      </footer>

      {/* MODAL EDIÇÃO */}
      {isModalOpen && editingVenue && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-8 border-b border-slate-800 bg-slate-800/40">
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Gestão do Registro</h3>
                <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mt-2">Dados Verificados</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-600 hover:text-white transition-colors">
                <X size={32} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">NOME DA CASA</label>
                  <input 
                    type="text" required
                    value={editingVenue.name}
                    onChange={e => setEditingVenue({...editingVenue, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">CIDADE</label>
                  <input 
                    type="text" required
                    value={editingVenue.city}
                    onChange={e => setEditingVenue({...editingVenue, city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">DDD</label>
                  <input 
                    type="text" required
                    value={editingVenue.ddd}
                    onChange={e => setEditingVenue({...editingVenue, ddd: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={20} />
                Confirmar Mudanças
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSTALL */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-cyan-600 to-blue-800 p-14 text-center relative">
              <button onClick={() => setIsInstallModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                <X size={32} />
              </button>
              <Smartphone size={72} className="text-white mx-auto mb-6 animate-bounce" />
              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">OCDB Mobile</h3>
              <p className="text-cyan-100 text-sm mt-4 font-bold uppercase tracking-widest">Seu banco de shows no bolso</p>
            </div>
            
            <div className="p-14 grid md:grid-cols-2 gap-10">
              <div className="bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700 flex flex-col items-center text-center hover:bg-slate-800 transition-all">
                <Smartphone size={44} className="text-cyan-500 mb-4" />
                <h4 className="font-black text-white mb-2 uppercase text-xs tracking-widest italic">Dispositivo Android</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">No Chrome, toque nos <span className="text-cyan-400 font-bold">(...)</span> e escolha <span className="text-cyan-400 font-bold">"Instalar Aplicativo"</span>.</p>
              </div>
              <div className="bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700 flex flex-col items-center text-center hover:bg-slate-800 transition-all">
                <Smartphone size={44} className="text-pink-500 mb-4" />
                <h4 className="font-black text-white mb-2 uppercase text-xs tracking-widest italic">iPhone / iPad</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">No Safari, use <span className="text-pink-400 font-bold">Compartilhar</span> e depois <span className="text-pink-400 font-bold">"Tela de Início"</span>.</p>
              </div>
            </div>
            <div className="p-10 bg-slate-950/50 text-center">
              <button onClick={() => setIsInstallModalOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-white font-black px-16 py-5 rounded-2xl transition-all uppercase text-[10px] tracking-[0.4em]">
                VOLTAR AO PAINEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
