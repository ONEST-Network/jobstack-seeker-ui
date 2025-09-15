import React from 'react';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("footer");

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const footerSections = [
    {
      title: t('footer.platform.title'),
      links: [
        { name: t('footer.platform.findJobs'), action: () => handleNavigation('/seeker') },
        { name: t('footer.platform.postJob'), action: () => handleNavigation('/provider') },
        { name: t('footer.platform.issueCertificates'), action: () => {} },
        { name: t('footer.platform.publicDashboard'), action: () => {} },
        { name: t('footer.platform.mobileApp'), action: () => {} }
      ]
    },
    {
      title: t('footer.resources.title'),
      links: [
        { name: t('footer.resources.helpCenter'), action: () => {} },
        { name: t('footer.resources.careerGuides'), action: () => {} },
        { name: t('footer.resources.skillDevelopment'), action: () => {} },
        { name: t('footer.resources.interviewTips'), action: () => {} },
        { name: t('footer.resources.resumeBuilder'), action: () => {} }
      ]
    },
    {
      title: t('footer.company.title'),
      links: [
        { name: t('footer.company.aboutUs'), action: () => {} },
        { name: t('footer.company.career'), action: () => {} },
        { name: t('footer.company.press'), action: () => {} },
        { name: t('footer.company.partnerWithUs'), action: () => {} },
        { name: t('footer.company.investorRelations'), action: () => {} }
      ]
    },
    {
      title: t('footer.legal.title'),
      links: [
        { name: t('footer.legal.terms'), action: () => {} },
        { name: t('footer.legal.privacy'), action: () => {} },
        { name: t('footer.legal.cookie'), action: () => {} },
        { name: t('footer.legal.dataProtection'), action: () => {} },
        { name: t('footer.legal.accessibility'), action: () => {} }
      ]
    }
  ];

  const socialLinks = [
    { name: 'LinkedIn', icon: '💼', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'Facebook', icon: '📘', url: '#' },
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'YouTube', icon: '📺', url: '#' }
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
              <span className="text-xl font-bold text-foreground">JobBridge</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {t('footer.description')}
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center 
                           hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                  aria-label={social.name}
                >
                  <span className="text-sm">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button
                      onClick={link.action}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200 text-left"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span>{t('footer.badges.madeInIndia')}</span>
            <span>{t('footer.badges.securePlatform')}</span>
            <span>{t('footer.badges.mobileFirst')}</span>
            <span>{t('footer.badges.languages')}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {t('footer.contact')}:{' '}
            <a href="mailto:support@jobbridge.in" className="text-primary hover:underline">
              support@jobbridge.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
