import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const JobRolesCarousel = () => {
  const { t } = useTranslation("jobrolescarousel");

  const jobRoles = [
    { name: t('jobRoles.electrician'), count: 2847, icon: '⚡', category: t('jobRoles.categories.technical') },
    { name: t('jobRoles.driver'), count: 5432, icon: '🚗', category: t('jobRoles.categories.transport') },
    { name: t('jobRoles.securityGuard'), count: 1923, icon: '🛡️', category: t('jobRoles.categories.security') },
    { name: t('jobRoles.welder'), count: 876, icon: '🔥', category: t('jobRoles.categories.technical') },
    { name: t('jobRoles.tailor'), count: 1234, icon: '✂️', category: t('jobRoles.categories.craft') },
    { name: t('jobRoles.carpenter'), count: 1567, icon: '🔨', category: t('jobRoles.categories.technical') },
    { name: t('jobRoles.machineOperator'), count: 3421, icon: '⚙️', category: t('jobRoles.categories.manufacturing') },
    { name: t('jobRoles.salesRep'), count: 4532, icon: '💼', category: t('jobRoles.categories.sales') },
    { name: t('jobRoles.plumber'), count: 987, icon: '🔧', category: t('jobRoles.categories.technical') },
    { name: t('jobRoles.mason'), count: 756, icon: '🧱', category: t('jobRoles.categories.construction') },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      [t('jobRoles.categories.technical')]: 'bg-blue-100 text-blue-800',
      [t('jobRoles.categories.transport')]: 'bg-green-100 text-green-800',
      [t('jobRoles.categories.security')]: 'bg-red-100 text-red-800',
      [t('jobRoles.categories.craft')]: 'bg-purple-100 text-purple-800',
      [t('jobRoles.categories.manufacturing')]: 'bg-orange-100 text-orange-800',
      [t('jobRoles.categories.sales')]: 'bg-pink-100 text-pink-800',
      [t('jobRoles.categories.construction')]: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t('jobRoles.popularCategoriesTitle')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('jobRoles.popularCategoriesDescription')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {jobRoles.map((role, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border border-border"
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{role.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{role.name}</h3>
                <Badge 
                  variant="secondary" 
                  className={`mb-3 ${getCategoryColor(role.category)}`}
                >
                  {role.category}
                </Badge>
                <div className="text-2xl font-bold text-primary mb-1">
                  {role.count.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">{t('jobRoles.openings')}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="text-primary hover:text-primary/80 font-medium">
            {t('jobRoles.viewAllCategories')} →
          </button>
        </div>
      </div>
    </section>
  );
};

export default JobRolesCarousel;
