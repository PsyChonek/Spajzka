/* eslint-disable no-console */
/**
 * Smoke test: connects to a running MCP server with a PAT from $MCP_SMOKE_PAT
 * and issues a few representative tool calls. Intended for local/CI validation.
 * Not a replacement for the unit/integration suites.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  const pat = process.env.MCP_SMOKE_PAT;
  const url = process.env.MCP_SMOKE_URL || 'http://localhost:3001/mcp';

  if (!pat) {
    console.error('MCP_SMOKE_PAT env var is required');
    process.exit(1);
  }

  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: { Authorization: `Bearer ${pat}` }
    }
  });
  const client = new Client({ name: 'spajzka-smoke', version: '1.0.0' });
  await client.connect(transport);

  console.log('\n=== whoami ===');
  console.log(await client.callTool({ name: 'whoami', arguments: {} }));

  console.log('\n=== list_groups ===');
  const groupsRes = await client.callTool({ name: 'list_groups', arguments: {} });
  console.log(groupsRes);

  const structured = (groupsRes as { structuredContent?: Array<{ _id: string; name: string }> }).structuredContent;
  if (!structured || structured.length === 0) {
    console.log('\nNo groups found. Create a group first to run the rest of the smoke test.');
    await client.close();
    return;
  }
  const groupId = structured[0]._id;

  console.log(`\n=== list_pantry (groupId=${groupId}) ===`);
  console.log(await client.callTool({ name: 'list_pantry', arguments: { groupId } }));

  console.log(`\n=== list_shopping (groupId=${groupId}) ===`);
  console.log(await client.callTool({ name: 'list_shopping', arguments: { groupId } }));

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  console.log(`\n=== list_meal_plan (groupId=${groupId}) ===`);
  console.log(await client.callTool({ name: 'list_meal_plan', arguments: { groupId, from: today, to: in30 } }));

  console.log(`\n=== preview_meal_plan_shopping (groupId=${groupId}) ===`);
  console.log(await client.callTool({ name: 'preview_meal_plan_shopping', arguments: { groupId, from: today, to: in30, missingOnly: true } }));

  await client.close();
  console.log('\nSmoke test complete.');
}

main().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
