import type { DiaSemana, Horario } from "@/modules/academia/schema";

export const DIAS: DiaSemana[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Primer horario a partir de hoy, recorriendo la semana desde el día actual
export function proximoHorario(horarios: Horario[]): Horario | undefined {
  const hoy = (new Date().getDay() + 6) % 7; // 0 = lunes
  const distancia = (h: Horario) => (DIAS.indexOf(h.diaSemana) - hoy + 7) % 7;
  return [...horarios].sort((a, b) => distancia(a) - distancia(b) || a.horaInicio.localeCompare(b.horaInicio))[0];
}

// "Hoy · 16:00" o "Mar · 16:00"
export function textoProximaClase(h: Horario): string {
  const hoy = DIAS[(new Date().getDay() + 6) % 7];
  return `${h.diaSemana === hoy ? "Hoy" : h.diaSemana.slice(0, 3)} · ${h.horaInicio}`;
}