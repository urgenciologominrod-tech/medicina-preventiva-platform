import { useState, useRef, useEffect } from 'react';

const FAQ = [
  {
    q: '¿Cómo accedo a un curso?',
    a: 'Ve a la sección "Cursos" en el menú superior. Haz clic en el curso que deseas tomar. Verás el contenido (videos e infografías) en orden. Completa todo el material para habilitar el examen.',
  },
  {
    q: '¿Qué pasa si repruebo el examen?',
    a: 'Puedes intentarlo de nuevo las veces que necesites. Te recomendamos revisar nuevamente el material del curso antes de volver a presentar el examen.',
  },
  {
    q: '¿Cómo descargo mi constancia?',
    a: 'Ve a la sección "Constancias" en el menú. Ahí encontrarás todas tus constancias obtenidas. Haz clic en "Descargar PDF" para guardar tu constancia.',
  },
  {
    q: '¿Cuándo son los cursos obligatorios?',
    a: 'Consulta la sección "Calendario" donde puedes ver la vista mensual y anual. Los cursos obligatorios aparecen resaltados en rojo.',
  },
  {
    q: '¿Qué es la matriz de competencias?',
    a: 'Es una tabla que muestra tu nivel de dominio (del 1 al 5) en 8 áreas clave de medicina preventiva. Se actualiza conforme avanzas en los cursos.',
  },
  {
    q: '¿Cuánto tiempo tengo para completar el examen?',
    a: 'Cada examen tiene un tiempo límite definido (visible en la parte superior al iniciarlo). Una vez que empieza el contador, no se detiene, así que revisa el material antes.',
  },
  {
    q: '¿Quién puede ver mis constancias?',
    a: 'Tus constancias son visibles solo para ti y para los administradores de la plataforma.',
  },
  {
    q: '¿A quién contacto para soporte?',
    a: 'Comunícate con el administrador de tu área o escribe al correo institucional de la Coordinación de Medicina Preventiva.',
  },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: '¡Hola! Soy el asistente de Medicina Preventiva. ¿En qué puedo ayudarte? Selecciona una pregunta o escribe la tuya.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendFAQ = (faq) => {
    setMessages(prev => [
      ...prev,
      { from: 'user', text: faq.q },
      { from: 'bot', text: faq.a }
    ]);
  };

  const sendInput = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    const match = FAQ.find(f => f.q.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(f.q.toLowerCase().split(' ').slice(1,3).join(' ')));
    setMessages(prev => [
      ...prev,
      { from: 'user', text: q },
      { from: 'bot', text: match ? match.a : 'No encontré una respuesta exacta para tu pregunta. Te recomiendo contactar al administrador o revisar las preguntas frecuentes listadas abajo.' }
    ]);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110"
        aria-label="Abrir asistente">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="bg-sky-600 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">🩺</div>
            <div>
              <p className="font-semibold text-sm">Asistente de Medicina Preventiva</p>
              <p className="text-xs opacity-75">Respuestas frecuentes</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-snug
                  ${m.from === 'user'
                    ? 'bg-sky-500 text-white rounded-br-sm'
                    : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Sugerencias FAQ */}
            <div className="space-y-1 pt-1">
              {FAQ.slice(0, 5).map((f, i) => (
                <button key={i} onClick={() => sendFAQ(f)}
                  className="w-full text-left text-xs bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-lg px-3 py-2 text-slate-600 transition-colors">
                  💬 {f.q}
                </button>
              ))}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendInput()}
            />
            <button onClick={sendInput} className="btn-primary px-3 py-2 text-sm">→</button>
          </div>
        </div>
      )}
    </>
  );
}
