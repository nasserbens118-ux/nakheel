import React, { useState } from 'react';
import { Calendar, Truck, CheckCircle, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { WasteRequest } from '../../services/db';

export const CollectCalendar: React.FC = () => {
  const { wasteRequests, users, updateWasteRequestStatus } = useNakheel();
  const { language } = useLanguage();
  const { toast } = useToast();
  const ar = language === 'ar';

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState('');

  const monthNames = ar
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const dayNames = ar
    ? ['ح','ن','ث','ر','خ','ج','س']
    : ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  const pending = wasteRequests.filter(w =>
    w.status === 'submitted' || w.status === 'ai_scored' || w.status === 'accepted'
  );
  const scheduled = wasteRequests.filter(w =>
    w.status === 'scheduled_for_pickup' && w.scheduledPickupDate
  );

  const scheduledByDate: Record<string, WasteRequest[]> = {};
  scheduled.forEach(w => {
    const d = w.scheduledPickupDate!.slice(0, 10);
    if (!scheduledByDate[d]) scheduledByDate[d] = [];
    scheduledByDate[d].push(w);
  });

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  let startDow = firstDay.getDay();
  startDow = (startDow + 6) % 7; // Monday first

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = (d: number) => `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const getSupplierName = (supplierId: string) => {
    const u = users.find(u => u.id === supplierId);
    return u?.name ?? supplierId;
  };

  const getWilaya = (w: WasteRequest) => {
    const u = users.find(u => u.id === w.supplierId);
    return u?.wilaya ?? w.location ?? '—';
  };

  const handleSchedule = async (id: string) => {
    if (!pickupDate) return;
    try {
      await updateWasteRequestStatus(id, 'scheduled_for_pickup', pickupDate);
      toast(ar ? 'تم برمجة الجمع ✓' : 'Collecte planifiée ✓', 'success');
      setSchedulingId(null);
      setPickupDate('');
    } catch {
      toast(ar ? 'خطأ' : 'Erreur', 'error');
    }
  };

  const selectedRequests = selectedDate ? (scheduledByDate[selectedDate] ?? []) : [];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={22} /> {ar ? 'تقويم الجمع' : 'Calendrier de Collecte'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.85rem' }}>
          {ar ? 'برمجة مواعيد الجمع وتصور التوزيع الشهري.' : 'Planifiez les tournées de collecte et visualisez leur répartition mensuelle.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Calendar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={prevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={20} />
            </button>
            <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem' }}>
              {monthNames[viewMonth]} {viewYear}
            </h3>
            <button onClick={nextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'gray', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const ds = dateStr(day);
              const hasPickups = scheduledByDate[ds]?.length > 0;
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              const count = scheduledByDate[ds]?.length ?? 0;
              return (
                <div
                  key={i}
                  onClick={() => hasPickups && setSelectedDate(isSelected ? null : ds)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    fontSize: '0.83rem',
                    cursor: hasPickups ? 'pointer' : 'default',
                    background: isSelected ? 'var(--primary)' : isToday ? 'var(--primary-light)' : hasPickups ? '#e8f5e9' : 'transparent',
                    color: isSelected ? 'white' : isToday ? 'var(--primary)' : 'inherit',
                    fontWeight: isToday || hasPickups ? 700 : 400,
                    border: isToday && !isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                    position: 'relative',
                  }}
                >
                  {day}
                  {hasPickups && (
                    <div style={{
                      position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: isSelected ? 'rgba(255,255,255,0.3)' : 'var(--primary)',
                      color: isSelected ? 'white' : 'white',
                      fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                    }}>
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'gray' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
              {ar ? 'جمع مبرمج' : 'Collecte planifiée'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 12, height: 12, borderRadius: '3px', border: '1px solid var(--primary)', display: 'inline-block' }} />
              {ar ? 'اليوم' : "Aujourd'hui"}
            </span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Selected date detail */}
          {selectedDate && selectedRequests.length > 0 && (
            <div className="card animate-fade-in">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                <Truck size={16} />
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString(ar ? 'ar-DZ' : 'fr-DZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              {selectedRequests.map(w => (
                <div key={w.id} style={{ padding: '0.65rem', background: 'var(--neutral-light)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', fontSize: '0.83rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{getSupplierName(w.supplierId)}</div>
                  <div style={{ color: 'gray', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <MapPin size={11} /> {getWilaya(w)} — <span className="numeric">{w.estimatedQuantityKg.toLocaleString()} kg</span>
                  </div>
                  <span className="badge badge-pending" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                    {ar ? 'مبرمج للجمع' : 'Programmé'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending to schedule */}
          <div className="card">
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
              <Clock size={16} />
              {ar ? 'في انتظار البرمجة' : 'En attente de planification'}
              {pending.length > 0 && (
                <span style={{ background: 'var(--status-rejected)', color: 'white', borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 800 }}>
                  {pending.length}
                </span>
              )}
            </h4>

            {pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'gray', fontSize: '0.83rem' }}>
                <CheckCircle size={28} style={{ color: '#27ae60', display: 'block', margin: '0 auto 8px' }} />
                {ar ? 'لا توجد طلبات معلقة' : 'Aucune demande en attente'}
              </div>
            ) : (
              pending.map(w => (
                <div key={w.id} style={{ borderBottom: '1px dashed var(--neutral-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{getSupplierName(w.supplierId)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'gray', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={10} /> {getWilaya(w)} — <span className="numeric">{w.estimatedQuantityKg.toLocaleString()} kg</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSchedulingId(schedulingId === w.id ? null : w.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.7rem', padding: '4px 10px', flexShrink: 0 }}
                    >
                      {ar ? 'برمجة' : 'Planifier'}
                    </button>
                  </div>

                  {schedulingId === w.id && (
                    <div className="animate-fade-in" style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        type="date"
                        className="form-input"
                        style={{ marginBottom: 0, flex: 1, fontSize: '0.8rem', padding: '6px 8px' }}
                        value={pickupDate}
                        min={todayStr}
                        onChange={e => setPickupDate(e.target.value)}
                      />
                      <button
                        onClick={() => handleSchedule(w.id)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.72rem', padding: '6px 12px', flexShrink: 0 }}
                        disabled={!pickupDate}
                      >
                        ✓
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary stats */}
          <div className="card" style={{ background: 'var(--primary-light)', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div className="numeric" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{scheduled.length}</div>
                <div style={{ fontSize: '0.72rem', color: 'gray' }}>{ar ? 'مبرمج' : 'Planifiés'}</div>
              </div>
              <div>
                <div className="numeric" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-rejected)' }}>{pending.length}</div>
                <div style={{ fontSize: '0.72rem', color: 'gray' }}>{ar ? 'في الانتظار' : 'En attente'}</div>
              </div>
              <div>
                <div className="numeric" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {scheduled.reduce((s, w) => s + w.estimatedQuantityKg, 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'gray' }}>kg {ar ? 'مبرمج' : 'planifié'}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
