import React from 'react';
import { Partner } from '../../../types/partner';
import { generateInitialsAvatar } from '../../utils/imageUtils';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface PartnerCardProps {
    partner: Partner;
    onContact: (partner: Partner) => void;
    isAuthenticated: boolean;
}

const PartnerCard: React.FC<PartnerCardProps> = ({
    partner,
    onContact,
    isAuthenticated
}) => {
    const isInstructor = Array.isArray(partner.role)
        ? partner.role.includes('instructor')
        : partner.role === 'instructor';

    const userType = isInstructor ? 'instructor' : 'student';

    const handleContactClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onContact(partner);
    };

    return (
        <Card noPadding hoverEffect className="h-full flex flex-col overflow-hidden group">
            {/* Image Section */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                <img
                    src={partner.foto || generateInitialsAvatar(partner.ad, userType)}
                    alt={partner.ad}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = generateInitialsAvatar(partner.ad, userType);
                    }}
                />

                {/* Gradients for text readability if we had overlay text, but here mostly for depth */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {partner.relevanceScore && partner.relevanceScore > 60 && (
                        <Badge variant="success" className="shadow-sm backdrop-blur-md bg-green-500/90 text-white border-none">
                            %{Math.round(partner.relevanceScore)} Uyum
                        </Badge>
                    )}
                </div>

                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    <Badge variant="neutral" className="shadow-sm backdrop-blur-md bg-white/90 text-gray-800 border-none">
                        {partner.seviye}
                    </Badge>
                    {isInstructor && (
                        <Badge variant="warning" className="shadow-sm">Eğitmen</Badge>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            {partner.ad}
                            {partner.yas > 0 && <span className="font-normal text-gray-500 text-lg ml-1">, {partner.yas}</span>}
                        </h3>
                        <p className="text-sm text-brand-secondary font-medium mt-0.5">{partner.konum}</p>
                    </div>
                    {partner.puan > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-bold text-gray-700">{partner.puan.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Physical Stats - Optional */}
                {(partner.boy || partner.kilo) && (
                    <div className="flex gap-3 text-xs text-gray-500 mb-3 font-medium">
                        {partner.boy && <span>📏 {partner.boy} cm</span>}
                        {partner.kilo && <span>⚖️ {partner.kilo} kg</span>}
                    </div>
                )}

                <div className="mt-2 mb-4">
                    <div className="flex flex-wrap gap-1.5">
                        {partner.dans.slice(0, 3).map((style, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {style}
                            </span>
                        ))}
                        {partner.dans.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100">
                                +{partner.dans.length - 3}
                            </span>
                        )}
                        {partner.dans.length === 0 && (
                            <span className="text-xs text-gray-400 italic">Dans stili belirtilmemiş</span>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-4">
                    <Button
                        fullWidth
                        variant="primary" /* Matches user request: CTA buttons with gradient from #C7416C to #8B5CF6 handled in Button component or override class here if needed. Button component uses bg-brand-primary by default. I'll add custom class for the specific gradient request */
                        className="!bg-brand-gradient hover:!shadow-lg hover:!shadow-brand-primary/30 border-0"
                        onClick={handleContactClick}
                    >
                        İletişime Geç
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default PartnerCard;
