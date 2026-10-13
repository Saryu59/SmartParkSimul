import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { formatDateTime, formatTimeOnly } from '../../utils/dateUtils';
import { QrCode, Download, Printer, ShieldCheck, Car, Calendar, Clock } from 'lucide-react';

export function QRCodeModal({ reservation, isOpen, onClose }) {
  if (!reservation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Entry Gate Access QR Pass" maxWidth="max-w-md">
      <div className="space-y-4 text-center">
        {/* Pass card */}
        <div className="bg-[#F7F8F6] border border-[#E2E6E2] rounded-2xl p-5 space-y-4">
          <div className="inline-block px-3 py-1 bg-[#EBF5F0] text-[#176B4D] border border-[#C6E2D6] rounded-full text-xs font-semibold uppercase tracking-wider font-mono">
            Slot {reservation.slotId} • Gate Pass
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-[#E2E6E2] inline-block">
            <QRCodeSVG
              value={reservation.qrCodePayload || reservation.id}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          <div>
            <div className="font-mono text-xl font-bold tracking-wider text-[#202923]">
              {reservation.id}
            </div>
            <div className="text-xs text-[#8A968F] mt-1 font-mono">
              Align pass at optical reader on gate pillar
            </div>
          </div>

          <div className="border-t border-[#E2E6E2] pt-3 text-xs text-[#5E6962] grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="text-[10px] text-[#8A968F] block font-semibold uppercase font-mono">Driver / Vehicle</span>
              <span className="font-medium text-[#202923]">{reservation.userName}</span>
              <span className="block text-[#5E6962] font-mono text-[11px]">{reservation.licensePlate}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A968F] block font-semibold uppercase font-mono">Schedule Interval</span>
              <span className="font-medium text-[#202923]">{formatTimeOnly(reservation.startTime)} – {formatTimeOnly(reservation.endTime)}</span>
              <span className="block text-[#5E6962] text-[11px] font-mono">{formatDateTime(reservation.startTime).split(',')[0]}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 border border-[#E2E6E2] rounded-xl text-xs font-semibold text-[#5E6962] hover:bg-[#F7F8F6] hover:text-[#202923] transition flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-[#176B4D] hover:bg-[#135C42] text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
