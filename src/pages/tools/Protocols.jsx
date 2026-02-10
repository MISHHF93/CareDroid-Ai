import SearchableToolPage from './SearchableToolPage';
import { useLanguage } from '../../contexts/LanguageContext';

const Protocols = () => {
  const { t } = useLanguage();

  const toolConfig = {
    id: 'protocols',
    icon: '📋',
    name: t('tools.protocols.name'),
    path: '/tools/protocols',
    color: '#A8E6CF',
    description: t('tools.protocols.description'),
    shortcut: 'Ctrl+4',
    category: t('tools.protocols.category')
  };

  const commonProtocols = [
    'Sepsis Management',
    'Acute MI/STEMI',
    'Stroke/TIA',
    'Anaphylaxis',
    'DKA Management',
    'COPD Exacerbation',
    'Pneumonia Treatment',
    'CHF Management',
    'VTE Prophylaxis',
    'Post-Op Care',
  ];

  return (
    <SearchableToolPage
      toolConfig={toolConfig}
      commonItems={commonProtocols}
      placeholder={t('tools.protocols.placeholder')}
      searchPrompt={t('tools.protocols.searchPrompt')}
      errorMessage={t('tools.protocols.errorMessage')}
    />
  );
};

export default Protocols;
