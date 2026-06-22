import { defineTool } from "eve/tools";
import { z } from "zod";
import { loadEntityCurationPacket } from "../lib/entity-curation.js";

export default defineTool({
  description: "Load Kocteau's local entity curation packet from tmp/entity-curation.",
  inputSchema: z.object({}),
  async execute() {
    const packet = await loadEntityCurationPacket();
    const tagCounts = Object.fromEntries(
      Object.entries(packet.input.availableTags ?? {}).map(([kind, tags]) => [
        kind,
        Array.isArray(tags) ? tags.length : 0,
      ]),
    );

    return {
      entities: packet.input.entities ?? [],
      entityCount: Array.isArray(packet.input.entities) ? packet.input.entities.length : 0,
      availableTags: packet.input.availableTags ?? {},
      tagCounts,
      prompt: packet.prompt,
      outputTemplate: packet.template,
      sourcePaths: {
        input: packet.paths.input,
        prompt: packet.paths.prompt,
        template: packet.paths.template,
        output: packet.paths.output,
      },
    };
  },
});
