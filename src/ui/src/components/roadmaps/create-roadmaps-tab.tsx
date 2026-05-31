import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import GenerateRoadmapFromText from './generate-from-text';
import GenerateRoadmapFromURL from './generate-from-url';

const CreateRoadmapTabs = () => {
	return (
		<Tabs defaultValue="url" className="w-full">
			<TabsList className="w-full">
				<TabsTrigger value="text">Use Raw Text</TabsTrigger>
				<TabsTrigger value="url">Use URL</TabsTrigger>
			</TabsList>
			<TabsContent value="text" className="mt-4">
				<GenerateRoadmapFromText />
			</TabsContent>
			<TabsContent value="url" className="mt-4">
				<GenerateRoadmapFromURL />
			</TabsContent>
		</Tabs>
	);
};

export default CreateRoadmapTabs;
