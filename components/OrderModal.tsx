import React, { useEffect } from 'react';
import { siteConfig } from '../config';

interface OrderModalProps {
  mode: 'whatsapp' | 'email';
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ mode, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleServiceClick = (serviceName: string) => {
        if (mode === 'whatsapp') {
            const message = `Hello, I'm interested in your "${serviceName}" service.`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${siteConfig.branding.whatsAppNumber}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        } else {
            const email = siteConfig.branding.email;
            const subject = encodeURIComponent(`Inquiry about "${serviceName}" service`);
            const body = encodeURIComponent(`Hello, I'm interested in your "${serviceName}" service.`);
            const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
            window.location.href = mailtoUrl;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                className="relative bg-gray-900/80 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 text-center"
                style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-white">Choose a Service to Get Started</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {siteConfig.content.services.all.map(service => {
                        const ServiceIcon = service.icon;
                        return (
                            <button
                                key={service.name}
                                onClick={() => handleServiceClick(service.name)}
                                className="group flex items-center gap-4 text-left p-4 bg-gray-800/50 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 rounded-lg transition-all duration-300 transform hover:scale-105"
                            >
                                {ServiceIcon && <ServiceIcon className="w-8 h-8 text-red-500 flex-shrink-0" />}
                                <span className="font-semibold text-gray-200 group-hover:text-white">{service.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};