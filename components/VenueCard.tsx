
import React from 'react';
import { Venue } from '../types';
import { MapPin, Instagram, Edit2, Trash2, Navigation, Clock } from 'lucide-react';

interface VenueCardProps {
  venue: Venue;
  onEdit: (venue: Venue) => void;
  onDelete: (id: string) => void;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onEdit, onDelete }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-7 shadow-2xl hover:shadow-cyan-900/20 transition-all group relative overflow-hidden flex flex-col h-full border-b-4 border-b-transparent hover:border-b-cyan-500 hover:-translate-y-1">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
        <Navigation size={100} className="text-cyan-500 rotate-12" />
      </div>
      
      {/* Header com Ações */}
      <div className="flex justify-between items-start mb-6 relative z-10 gap-3">
        <div className="flex-1">
          <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors leading-[1.1] italic uppercase tracking-tighter">
            {venue.name}
          </h3>
          <div className="flex items-center gap-2 text-slate-500 mt-2.5">
            <MapPin size={14} className="text-rose-600 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest truncate">
              {venue.city} <span className="text-slate-700 ml-1">[{venue.ddd}]</span>
            </span>
          </div>
        </div>
        
        {/* Ações principais lado a lado */}
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => onEdit(venue)}
            className="p-2.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-all shadow-lg border border-transparent hover:border-slate-700"
            title="Editar informações"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(venue.id)}
            className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 rounded-xl transition-all shadow-lg border border-transparent hover:border-rose-900/30"
            title="Apagar da lista"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Conteúdo Técnico */}
      <div className="mt-auto space-y-5 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Distância</span>
            <div className="flex items-center gap-2">
              <Navigation size={14} className="text-cyan-500" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-tighter">
                {venue.distanceKm.toFixed(1)} KM
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Viagem</span>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-tighter">
                {venue.travelTime || '--'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/50 pt-4">
            {venue.socialMedia ? (
              <a 
                href={venue.socialMedia.startsWith('http') ? venue.socialMedia : `https://instagram.com/${venue.socialMedia.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-pink-500 transition-all px-1 group/insta"
              >
                <Instagram size={16} className="text-pink-600 group-hover/insta:scale-110 transition-transform" />
                <span>Instagram</span>
              </a>
            ) : <div className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Sem Social</div>}
            
            <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.2em]">Biguaçu Ref.</span>
        </div>
      </div>
    </div>
  );
};
