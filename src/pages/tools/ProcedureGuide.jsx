import SearchableToolPage from './SearchableToolPage';
import { useLanguage } from '../../contexts/LanguageContext';

const ProcedureGuide = () => {
  const { t } = useLanguage();

  const toolConfig = {
    id: 'procedures',
    icon: '⚕️',
    name: t('tools.procedureGuide.name'),
    path: '/tools/procedures',
    color: '#6BCB77',
    description: t('tools.procedureGuide.description'),
    shortcut: 'Ctrl+6',
    category: t('tools.procedureGuide.category')
  };

  const commonProcedures = [
    'Central Line Placement',
    'Lumbar Puncture',
    'Intubation',
    'Chest Tube Insertion',
    'Arterial Line',
    'Paracentesis',
    'Thoracentesis',
    'Nasogastric Tube',
    'Foley Catheter',
    'Wound Closure',
  ];

  return (
    <SearchableToolPage
      toolConfig={toolConfig}
      commonItems={commonProcedures}
      placeholder={t('tools.procedureGuide.placeholder')}
      searchPrompt={t('tools.procedureGuide.searchPrompt')}
      errorMessage={t('tools.procedureGuide.errorMessage')}
    />
  );
};

export default ProcedureGuide;
