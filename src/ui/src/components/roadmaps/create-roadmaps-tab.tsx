import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { RoadmapFormValues } from './create-roadmap-modal';
import GenerateRoadmapFromText from './generate-from-text';
import GenerateRoadmapFromURL from './generate-from-url';

type Props = {
	activeTab: 'url' | 'text';
	onTabChange: (tab: 'url' | 'text') => void;
	register: UseFormRegister<RoadmapFormValues>;
	errors: FieldErrors<RoadmapFormValues>;
};

const CreateRoadmapTabs = ({
	activeTab,
	onTabChange,
	register,
	errors,
}: Props) => {
	return (
		<Tabs
			value={activeTab}
			onValueChange={(v) => onTabChange(v as 'url' | 'text')}
			className="w-full"
		>
			<TabsList className="w-full">
				<TabsTrigger value="text">Use Raw Text</TabsTrigger>
				<TabsTrigger value="url">Use URL</TabsTrigger>
			</TabsList>
			<TabsContent value="text" className="mt-4">
				<GenerateRoadmapFromText register={register} errors={errors} />
			</TabsContent>
			<TabsContent value="url" className="mt-4">
				<GenerateRoadmapFromURL register={register} errors={errors} />
			</TabsContent>
		</Tabs>
	);
};

export default CreateRoadmapTabs;
