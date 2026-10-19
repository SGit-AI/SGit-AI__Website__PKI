#!/usr/bin/env node
/* gen_agent_tool.mjs: agents/pki-agent.mjs, one file an agent can fetch with curl, from agents/pki-agent.src.mjs and the
 * modules it imports from assets/people/. Each module becomes a namespace in the file (its exports returned from a
 * function), so the bundled tool runs exactly the code the site runs, with nothing renamed and nothing rewritten but the
 * import and export lines.
 *
 *   node admin/build/gen_agent_tool.mjs           write agents/pki-agent.mjs
 *   node admin/build/gen_agent_tool.mjs --check   exit 1 if it is stale (validate.js runs this)
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const SRC = path.join(ROOT, 'agents/pki-agent.src.mjs'), OUT = path.join(ROOT, 'agents/pki-agent.mjs')
const MODULES = ['keys', 'directory', 'message']                 // in dependency order

function namespace(name) {
    let src = fs.readFileSync(path.join(ROOT, `assets/people/${name}.js`), 'utf8')
    const exported = new Set()
    src = src.replace(/^import \{([^}]+)\} from '\.\/(\w+)\.js'\n/gm, (_, names, mod) => `const {${names}} = __${mod}\n`)
    src = src.replace(/^import \* as (\w+) from '\.\/(\w+)\.js'\n/gm, (_, as, mod) => `const ${as} = __${mod}\n`)
    if (/^import /m.test(src)) throw new Error(`${name}.js: an import the bundler does not handle`)
    src = src.replace(/^export (async function|function|const|let) (\w+)/gm, (_, kw, id) => { exported.add(id); return `${kw} ${id}` })
    src = src.replace(/^export \{([^}]+)\}\n?/gm, (_, names) => { for (const n of names.split(',')) exported.add(n.trim()); return '' })
    if (/^export /m.test(src)) throw new Error(`${name}.js: an export the bundler does not handle`)
    return `// ---------------------------------------------------------------- assets/people/${name}.js\nconst __${name} = (() => {\n${src}\nreturn { ${[...exported].join(', ')} }\n})()\n`
}
function build() {
    let src = fs.readFileSync(SRC, 'utf8')
    const head = src.slice(0, src.indexOf('import fs'))
    src = src.slice(head.length)
    src = src.replace(/^import \* as (\w+) from '\.\.\/assets\/people\/(\w+)\.js'\n/gm, (_, as, mod) => `const ${as} = __${mod}\n`)
    const imports = src.match(/^import .* from '(fs|os|path)'\n/gm).join('')
    src = src.replace(/^import .* from '(fs|os|path)'\n/gm, '')
    return head.replace(' * agents/pki-agent.mjs is generated', ' * THIS FILE is generated') + imports + '\n' + MODULES.map(namespace).join('\n') + '\n// ---------------------------------------------------------------- the tool (agents/pki-agent.src.mjs)\n' + src
}
const out = build()
if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== out) { console.error('agents/pki-agent.mjs is stale: run node admin/build/gen_agent_tool.mjs'); process.exit(1) }
} else { fs.writeFileSync(OUT, out); console.log(`agents/pki-agent.mjs: ${out.length} bytes`) }
