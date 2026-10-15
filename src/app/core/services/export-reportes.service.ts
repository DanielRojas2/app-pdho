import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ResumenCumplimientoExport {
  total: number;
  declarados: number;
  incompletos: number;
  pendientes: number;
  observados: number;
}

export interface MesDetalleExport {
  mes: string;
  gestion: number;
  presentado: boolean;
  estado: string;
  fechaPresentacion?: string;
  nroFormulario?: string;
}

export interface HotelCumplimientoExport {
  id: number;
  nombre: string;
  categoria: string;
  operador: string;
  telefono: string;
  estado: string;
  totalMesesEsperados: number;
  totalMesesPresentados: number;
  fecha?: string;
  nroFormulario?: string;
  mesesPresentados: MesDetalleExport[];
  mesesPendientes: MesDetalleExport[];
  todosLosMeses: MesDetalleExport[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportReportesService {

  // ==========================================
  // 1. EXPORTACIÓN GENERAL A EXCEL (.XLSX)
  // ==========================================
  exportarCumplimientoExcel(
    hoteles: HotelCumplimientoExport[],
    periodoLabel: string,
    resumen: ResumenCumplimientoExport
  ): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen y Listado de Establecimientos
    const rows: (string | number)[][] = [
      ['GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO'],
      ['PLATAFORMA DEPARTAMENTAL HOTELERA ORURO (PDHO)'],
      ['REPORTE OFICIAL DE CUMPLIMIENTO DE FORMULARIOS'],
      [''],
      ['Criterio / Período:', periodoLabel],
      ['Fecha de Emisión:', new Date().toLocaleDateString('es-BO') + ' ' + new Date().toLocaleTimeString('es-BO')],
      ['Total Establecimientos:', resumen.total],
      ['Declarados (Completos):', resumen.declarados],
      ['Incompletos:', resumen.incompletos],
      ['Pendientes (Sin Declarar):', resumen.pendientes],
      ['Observados:', resumen.observados],
      [''],
      [
        'N°',
        'Establecimiento',
        'Categoría',
        'Operador Responsable',
        'Teléfono',
        'Estado Declaración',
        'Meses Presentados',
        'Meses Esperados',
        '% Cumplimiento',
        'Última Presentación',
        'Nro. Formulario'
      ]
    ];

    hoteles.forEach((h, index) => {
      const pct = h.totalMesesEsperados > 0
        ? Math.round((h.totalMesesPresentados / h.totalMesesEsperados) * 100)
        : (h.estado === 'DECLARADO' ? 100 : 0);

      rows.push([
        index + 1,
        h.nombre,
        h.categoria,
        h.operador,
        h.telefono,
        h.estado,
        h.totalMesesPresentados,
        h.totalMesesEsperados,
        `${pct}%`,
        h.fecha || '—',
        h.nroFormulario ? `#${h.nroFormulario}` : '—'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Ajuste de anchos de columna
    ws['!cols'] = [
      { wch: 5 },  // N°
      { wch: 30 }, // Establecimiento
      { wch: 18 }, // Categoría
      { wch: 25 }, // Operador
      { wch: 14 }, // Teléfono
      { wch: 16 }, // Estado
      { wch: 18 }, // Meses Pres.
      { wch: 16 }, // Meses Esp.
      { wch: 14 }, // % Cumplimiento
      { wch: 18 }, // Fecha
      { wch: 16 }  // Nro Formulario
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Cumplimiento_General');

    // Descargar archivo
    const safeName = periodoLabel.replace(/[\/\s:,-]+/g, '_').toLowerCase();
    XLSX.writeFile(wb, `reporte_cumplimiento_pdho_${safeName}.xlsx`);
  }

  // ==========================================
  // 2. EXPORTACIÓN GENERAL A PDF (.PDF)
  // ==========================================
  exportarCumplimientoPdf(
    hoteles: HotelCumplimientoExport[],
    periodoLabel: string,
    resumen: ResumenCumplimientoExport
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [132, 13, 35]; // Carmesí institucional #840d23
    const textColor = [15, 23, 42];     // Slate 900 #0f172a
    const mutedColor = [100, 116, 139]; // Slate 500 #64748b

    // Membrete Superior
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 8, 'F');

    // Título Institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Plataforma Departamental Hotelera Oruro (PDHO) — Dirección de Turismo y Cultura', 14, 23);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Reporte Oficial de Cumplimiento de Declaraciones', 14, 32);

    // Caja de contexto y métricas
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 36, 269, 18, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Criterio: ${periodoLabel}`, 18, 43);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-BO')} ${new Date().toLocaleTimeString('es-BO')}`, 18, 49);

    // Resumen en badges dentro del cuadro
    const badgesText = `Total: ${resumen.total}   |   Declarados: ${resumen.declarados}   |   Incompletos: ${resumen.incompletos}   |   Pendientes: ${resumen.pendientes}   |   Observados: ${resumen.observados}`;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(badgesText, 140, 46);

    // Preparar filas para la tabla
    const tableBody = hoteles.map((h, i) => {
      const pct = h.totalMesesEsperados > 0
        ? `${Math.round((h.totalMesesPresentados / h.totalMesesEsperados) * 100)}% (${h.totalMesesPresentados}/${h.totalMesesEsperados})`
        : (h.estado === 'DECLARADO' ? '100%' : '0%');

      return [
        (i + 1).toString(),
        h.nombre,
        h.categoria,
        h.operador,
        h.telefono,
        h.estado,
        pct,
        h.fecha || '—',
        h.nroFormulario ? `#${h.nroFormulario}` : '—'
      ];
    });

    autoTable(doc, {
      startY: 58,
      head: [[
        'N°',
        'Establecimiento',
        'Categoría',
        'Operador Responsable',
        'Teléfono',
        'Estado',
        'Progreso',
        'Fecha Presentación',
        'Nro. Formulario'
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [132, 13, 35],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 55, fontStyle: 'bold' },
        2: { cellWidth: 28 },
        3: { cellWidth: 45 },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 30, halign: 'center' },
        7: { cellWidth: 26, halign: 'center' },
        8: { cellWidth: 25, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        // Pie de página institucional
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          'Documento oficial generado por la Plataforma Departamental Hotelera Oruro (PDHO)',
          14,
          202
        );
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          270,
          202,
          { align: 'right' }
        );
      }
    });

    const safeName = periodoLabel.replace(/[\/\s:,-]+/g, '_').toLowerCase();
    doc.save(`reporte_cumplimiento_pdho_${safeName}.pdf`);
  }

  // ==========================================
  // 3. EXPORTAR DETALLE INDIVIDUAL A EXCEL
  // ==========================================
  exportarDetalleHotelExcel(
    hotel: HotelCumplimientoExport,
    periodoLabel: string
  ): void {
    const wb = XLSX.utils.book_new();

    const pct = hotel.totalMesesEsperados > 0
      ? Math.round((hotel.totalMesesPresentados / hotel.totalMesesEsperados) * 100)
      : (hotel.estado === 'DECLARADO' ? 100 : 0);

    const rows: (string | number)[][] = [
      ['GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO'],
      ['PLATAFORMA DEPARTAMENTAL HOTELERA ORURO (PDHO)'],
      [`DETALLE DE CUMPLIMIENTO INDIVIDUAL — ${hotel.nombre.toUpperCase()}`],
      [''],
      ['Establecimiento:', hotel.nombre],
      ['Categoría:', hotel.categoria],
      ['Operador Responsable:', hotel.operador],
      ['Teléfono de Contacto:', hotel.telefono],
      ['Período Consultado:', periodoLabel],
      ['Estado Global:', hotel.estado],
      ['Meses Presentados:', `${hotel.totalMesesPresentados} de ${hotel.totalMesesEsperados}`],
      ['Porcentaje de Cumplimiento:', `${pct}%`],
      ['Fecha de Emisión:', new Date().toLocaleDateString('es-BO') + ' ' + new Date().toLocaleTimeString('es-BO')],
      [''],
      ['DETALLE MENSUAL DE DECLARACIONES EVALUADAS:'],
      ['N°', 'Período / Mes', 'Gestión', 'Condición', 'Estado Formulario', 'Fecha Presentación', 'Nro. Formulario']
    ];

    const meses = hotel.todosLosMeses.length > 0 ? hotel.todosLosMeses : [
      ...hotel.mesesPresentados,
      ...hotel.mesesPendientes
    ];

    meses.forEach((m, idx) => {
      rows.push([
        idx + 1,
        m.mes,
        m.gestion,
        m.presentado ? 'PRESENTADO' : 'INCOMPLETO',
        m.estado,
        m.fechaPresentacion || '—',
        m.nroFormulario ? `#${m.nroFormulario}` : '—'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 10 },
      { wch: 28 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Detalle_Establecimiento');

    const safeHotel = hotel.nombre.replace(/[\/\s:,-]+/g, '_').toLowerCase();
    XLSX.writeFile(wb, `detalle_cumplimiento_${safeHotel}.xlsx`);
  }

  // ==========================================
  // 4. EXPORTAR DETALLE INDIVIDUAL A PDF
  // ==========================================
  exportarDetalleHotelPdf(
    hotel: HotelCumplimientoExport,
    periodoLabel: string
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [132, 13, 35];
    const textColor = [15, 23, 42];
    const mutedColor = [100, 116, 139];

    // Membrete Superior
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 6, 'F');

    // Títulos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO', 14, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Plataforma Departamental Hotelera Oruro (PDHO) — Control de Cumplimiento', 14, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Ficha Detallada de Cumplimiento Mensual', 14, 30);

    // Tarjeta del Establecimiento
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 34, 182, 38, 2, 2, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(hotel.nombre, 20, 42);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Categoría: ${hotel.categoria}`, 20, 48);
    doc.text(`Operador: ${hotel.operador}`, 20, 54);
    doc.text(`Teléfono: ${hotel.telefono}`, 20, 60);

    const pct = hotel.totalMesesEsperados > 0
      ? Math.round((hotel.totalMesesPresentados / hotel.totalMesesEsperados) * 100)
      : (hotel.estado === 'DECLARADO' ? 100 : 0);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Período Evaluado: ${periodoLabel}`, 110, 48);
    doc.text(`Estado Global: ${hotel.estado}`, 110, 54);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Cumplimiento: ${pct}% (${hotel.totalMesesPresentados}/${hotel.totalMesesEsperados} meses)`, 110, 60);

    // Subtítulo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Historial de Meses Evaluados en el Período:', 14, 79);

    const meses = hotel.todosLosMeses.length > 0 ? hotel.todosLosMeses : [
      ...hotel.mesesPresentados,
      ...hotel.mesesPendientes
    ];

    const tableBody = meses.map((m, idx) => [
      (idx + 1).toString(),
      `${m.mes} ${m.gestion}`,
      m.presentado ? 'PRESENTADO' : 'INCOMPLETO',
      m.estado,
      m.fechaPresentacion || '—',
      m.nroFormulario ? `#${m.nroFormulario}` : '—'
    ]);

    autoTable(doc, {
      startY: 83,
      head: [[
        'N°',
        'Mes / Período',
        'Condición',
        'Estado',
        'Fecha Presentación',
        'Nro. Formulario'
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [132, 13, 35],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 35, halign: 'center' },
        5: { cellWidth: 32, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Fecha de emisión: ${new Date().toLocaleDateString('es-BO')} — Plataforma Departamental Hotelera Oruro`,
          14,
          285
        );
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, 196, 285, { align: 'right' });
      }
    });

    const safeHotel = hotel.nombre.replace(/[\/\s:,-]+/g, '_').toLowerCase();
    doc.save(`detalle_cumplimiento_${safeHotel}.pdf`);
  }
}
