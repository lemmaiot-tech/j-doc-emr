
import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import Modal from './Modal';
import Button from './Button';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const qrcodeRegionId = "html5qr-code-full-region";

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      const verbose = false;
      const html5Qrcode = new Html5Qrcode(qrcodeRegionId, verbose);
      scannerRef.current = html5Qrcode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      const successCallback = (decodedText: string) => {
        onScanSuccess(decodedText);
      };
      
      const errorCallback = (errorMessage: string) => {
        // console.warn(`QR error: ${errorMessage}`);
      };

      html5Qrcode.start({ facingMode: "environment" }, config, successCallback, errorCallback)
        .catch(err => {
          console.error("Unable to start scanning.", err);
          alert("Error: Could not start camera. Please ensure permissions are granted and you are using a secure (HTTPS) connection.");
          onClose();
        });

    }

    return () => {
        if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.stop()
              .then(() => {
                scannerRef.current = null;
              })
              .catch(err => console.error("Failed to stop scanner", err));
        }
    };
  }, [isOpen, onScanSuccess, onClose]);
  

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Patient ID">
        <div className="space-y-4">
            <div id={qrcodeRegionId} style={{ width: '100%' }}></div>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Point the camera at the patient's ID barcode or QR code.
            </div>
            <div className="flex justify-end">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
        </div>
    </Modal>
  );
};

export default ScannerModal;
