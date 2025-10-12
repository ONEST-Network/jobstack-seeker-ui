
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useI18n';

const Footer = () => {
  const navigate = useNavigate();
  const t = useTranslation('footer');

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { name: 'Find Jobs', action: () => handleNavigation('/seeker') },
        { name: 'Post a Job', action: () => handleNavigation('/provider') },
        { name: 'Issue Certificates', action: () => {} },
        { name: 'Public Dashboard', action: () => {} },
        { name: 'Mobile App', action: () => {} }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', action: () => {} },
        { name: 'Career Guides', action: () => {} },
        { name: 'Skill Development', action: () => {} },
        { name: 'Interview Tips', action: () => {} },
        { name: 'Resume Builder', action: () => {} }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', action: () => {} },
        { name: 'Career', action: () => {} },
        { name: 'Press', action: () => {} },
        { name: 'Partner with Us', action: () => {} },
        { name: 'Investor Relations', action: () => {} }
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms & Conditions', action: () => {} },
        { name: 'Privacy Policy', action: () => {} },
        { name: 'Cookie Policy', action: () => {} },
        { name: 'Data Protection', action: () => {} },
        { name: 'Accessibility', action: () => {} }
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
              {t('companyInfo.description', 'Connecting talent with opportunities across India. Built for MSME and blue-collar workforce with AI-powered matching and local language support.')}
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
            {t('copyright', '© 2024 JobBridge. All rights reserved.')}
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span>{t('bottomFooter.madeInIndia', '🇮🇳 Made in India')}</span>
            <span>{t('bottomFooter.securePlatform', '🔒 Secure Platform')}</span>
            <span>{t('bottomFooter.mobileFirst', '📱 Mobile First')}</span>
            <span>{t('bottomFooter.languages', '🌐 15+ Languages')}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {t('bottomFooter.contact', 'Contact:')} <a href="mailto:support@jobbridge.in" className="text-primary hover:underline">
              {t('bottomFooter.supportEmail', 'support@jobbridge.in')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
