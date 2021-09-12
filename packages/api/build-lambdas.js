const { pnpPlugin } = require('@yarnpkg/esbuild-plugin-pnp');
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function main() {
  const entryPoints = fs
    .readdirSync(path.join(__dirname, 'src'))
    .map((f) => path.join(__dirname, 'src', f, 'lambda.ts'))
    .filter((f) => fs.existsSync(f));

  for (let i = 0; i < entryPoints.length; i++) {
    const entryPoint = entryPoints[i];
    const name = path.basename(path.dirname(entryPoint));
    await esbuild.build({
      entryPoints: [entryPoint],
      outfile: `functions/${name}.js`,
      plugins: [pnpPlugin()],
      bundle: true,
      platform: 'node',
      target: 'node14',
      external: ['aws-sdk'],
    });
  }
}
