"""Read-only source mapping. Write a private V2 bundle outside the repository.

Every populated source column retains its cached value, original formula and cell
reference. Source snapshots never stand in for approved fitment or physical stock.
"""
import argparse
import hashlib
import importlib.util
import json
import re
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter

spec = importlib.util.spec_from_file_location('legacy_source_prep', Path(__file__).with_name('prepare-package-sources.py'))
legacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)
cents = legacy.cents

FLATBED_FIELDS = ['sourceQuantity', 'title', 'nameZh', 'supplierSku', 'purchaseCostCents', 'dimensionsMm', 'weightKg', 'description', 'descriptionZh', 'branding', 'changes', 'changesZh', 'notesZh', 'cogsCents', 'retailCents', 'installedCents', 'promotion.retailCents', 'promotion.installedCents']
WEEKENDER_FIELDS = ['vehicle.model', 'vehicle.years', 'sourceTotals.frontOnly.retailCents', 'sourceTotals.frontOnly.costCents', 'sourceTotals.frontOnly.laborCents', 'sourceTotals.frontOnly.partsCents', 'sourceTotals.frontRear.retailCents', 'sourceTotals.frontRear.costCents', 'sourceTotals.frontRear.laborCents', 'sourceTotals.frontRear.partsCents', 'sourceTotals.priceDifferenceCents', 'specs.recommendedLiftHeight', 'components.front.name', 'components.front.sku', 'components.front.quantity', 'components.front.costCents', 'components.front.retailCents', 'components.rear.name', 'components.rear.sku', 'components.rear.quantity', 'components.rear.costCents', 'components.rear.retailCents', 'components.strutMount.sku', 'components.strutMount.quantity', 'components.strutMount.costCents', 'components.strutMount.retailCents', 'specs.stockCoil', 'specs.levelingMethod', 'components.lowerBolt.sku', 'components.lowerBolt.quantity', 'components.lowerBolt.costCents', 'components.lowerBolt.retailCents', 'components.mountingHardware.sku', 'components.mountingHardware.costCents', 'components.mountingHardware.retailCents', 'components.diffDrop.sku', 'components.diffDrop.costCents', 'components.diffDrop.retailCents', 'labor.alignmentCents', 'labor.frontHours', 'labor.rustHours', 'labor.rearHours', 'description']
LIGHT_FIELDS = ['sourceTotals.retailCents', 'sourceTotals.laborCents', 'sourceTotals.partsCents', 'vehicle.model', 'vehicle.years', 'components.front.name', 'components.front.sku', 'components.front.costCents', 'components.front.retailCents', 'components.rear.name', 'components.rear.sku', 'components.rear.quantity', 'components.rear.costCents', 'components.rear.retailCents', 'components.uca.sku', 'components.uca.costCents', 'components.uca.retailCents', 'components.brakeLines.sku', 'components.brakeLines.costCents', 'components.brakeLines.retailCents', 'components.diffDrop.sku', 'components.diffDrop.costCents', 'components.diffDrop.retailCents', 'components.camBolt.sku', 'components.camBolt.quantity', 'components.camBolt.costCents', 'components.camBolt.retailCents', 'components.bumpStops.name', 'components.bumpStops.quantity', 'components.bumpStops.costCents', 'components.bumpStops.retailCents', 'labor.frontHours', 'labor.rustHours', 'description', 'vehicleQuestions']
HEAVY_FIELDS = LIGHT_FIELDS[:27] + ['labor.frontHours', 'labor.rustHours', 'description']
ELECTRICAL_FIELDS = ['componentType', 'model', 'feedsTo', 'purpose', 'bomText']

def numeric(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else None

def assign(target, path, value):
    parts = path.split('.')
    for key in parts[:-1]:
        target = target.setdefault(key, {})
    target[parts[-1]] = value

def snapshot(file, sheet, row, values, formulas, headers, fields, source_id, kind, group=''):
    cells, mapped, field_map = {}, {}, {}
    for i, target in enumerate(fields):
        col = get_column_letter(i + 1)
        value = values[i] if i < len(values) else None
        formula = formulas[i] if i < len(formulas) and isinstance(formulas[i], str) and formulas[i].startswith('=') else None
        field_map[col] = target
        cells[col] = {'cell': f'{col}{row}', 'label': str(headers[i] or col) if i < len(headers) else col, 'value': value, 'formula': formula}
        if target.endswith('Cents'):
            value = cents(value)
        elif target.endswith('Hours') or target.endswith('.quantity') or target in ('weightKg', 'sourceQuantity'):
            value = numeric(value)
        assign(mapped, target, value)
    name = mapped.get('title') or mapped.get('componentType') or mapped.get('vehicle', {}).get('model') or f'Row {row}'
    key = f'{source_id}:{sheet}:{row}:{kind}'
    return {'sourceKey': key, 'kind': kind, 'title': str(name), 'group': group or sheet, 'file': file, 'sheet': sheet, 'row': row, 'mapped': mapped, 'columns': cells, 'fieldMap': field_map}

def quantity_part(text):
    # Parse only quantities/units actually written in the BOM. Do not infer one.
    match = re.match(r'^\s*(\d+(?:\.\d+)?)\s*(×|x\b|ft\b|m\b|in\b)\s*(.+)$', text, re.I)
    if not match:
        return None, 'each', text.strip()
    amount, unit, name = match.groups()
    return float(amount), 'each' if unit.lower() in ('×', 'x') else unit.lower(), name.strip()

def split_bom_components(text):
    # A positive electrical terminal is not a separator: preserve “IP22 + OUT”.
    parts, start, depth = [], 0, 0
    for i, char in enumerate(text):
        if char == '(':
            depth += 1
        elif char == ')':
            depth = max(0, depth - 1)
        elif char == '+' and depth == 0 and i > 0 and i + 1 < len(text) and text[i-1].isspace() and text[i+1].isspace():
            parts.append(text[start:i].strip())
            start = i + 1
    parts.append(text[start:].strip())
    return [part for part in parts if part]

def build(args):
    bundle = legacy.prepare(args)
    bundle['format'] = 'NJO_PACKAGE_WORKSHOP_V2'
    bundle['mappingVersion'] = 2
    source_id = bundle['sourceId']
    rows, products = [], {p['sourceKey']: p for p in bundle['products']}
    values_books, formula_books = {}, {}
    for label in ('lifts', 'flatbeds', 'electrical'):
        path = Path(getattr(args, label))
        values_books[label] = load_workbook(path, read_only=True, data_only=True)
        formula_books[label] = load_workbook(path, read_only=True, data_only=False)
    # All current lift vehicles are captured as source rows. Only the agreed Tacoma
    # three-package pilot becomes an operational package record.
    lift_rows = {}
    for sheet_name, fields, level in [('Weekender', WEEKENDER_FIELDS, 'weekender'), ('Overlander (light)', LIGHT_FIELDS, 'overlander-light'), ('Overlander (Heavy)', HEAVY_FIELDS, 'overlander-heavy')]:
        s, f = values_books['lifts'][sheet_name], formula_books['lifts'][sheet_name]
        values = list(s.iter_rows(values_only=True))
        formulas = list(f.iter_rows(values_only=True))
        for row_no in range(3, len(values) + 1):
            row = values[row_no - 1]
            model_col, years_col = (0, 1) if level == 'weekender' else (3, 4)
            if len(row) <= years_col or not row[model_col] or not row[years_col]:
                continue
            item = snapshot(Path(args.lifts).name, sheet_name, row_no, row, formulas[row_no - 1], values[1], fields, source_id, 'lift', level)
            rows.append(item)
            if str(row[model_col]) == 'Tacoma' and str(row[years_col]) == '16–23':
                lift_rows[level] = item
    # Preserve deprecated rows as source evidence; they are never made packages.
    for sheet_name in values_books['lifts'].sheetnames:
        if sheet_name in ('Weekender', 'Overlander (light)', 'Overlander (Heavy)'):
            continue
        s = values_books['lifts'][sheet_name]
        f = formula_books['lifts'][sheet_name]
        formulas = list(f.iter_rows(values_only=True))
        for row_no, row in enumerate(s.iter_rows(values_only=True), 1):
            if any(v is not None for v in row):
                headers = [f'Column {get_column_letter(i+1)}' for i in range(len(row))]
                rows.append(snapshot(Path(args.lifts).name, sheet_name, row_no, row, formulas[row_no-1], headers, [f'legacy.{get_column_letter(i+1)}' for i in range(len(row))], source_id, 'legacy', sheet_name))
    # Flatbed source rows stay separate even when the supplier reused a SKU.
    s, f = values_books['flatbeds'].active, formula_books['flatbeds'].active
    values, formulas = list(s.iter_rows(values_only=True)), list(f.iter_rows(values_only=True))
    group = ''
    for row_no, row in enumerate(values, 1):
        if row_no == 1:
            continue
        if row[0] and not row[1]:
            group = str(row[0]).strip()
        if not row[1] or not row[3]:
            continue
        item = snapshot(Path(args.flatbeds).name, s.title, row_no, row, formulas[row_no-1], values[0], FLATBED_FIELDS, source_id, 'flatbed', group)
        rows.append(item)
        product = products['flatbed:' + str(row[3]).strip()]
        fields = {k: v for k, v in item['mapped'].items() if k not in ('title', 'supplierSku')}
        fields['unit'] = 'each'
        fields.setdefault('promotion', {}).update({'label': 'Historical Labor Day source', 'enabled': False, 'startsOn': None, 'endsOn': None})
        variant = {'sourceRowKey': item['sourceKey'], 'title': str(row[1]), 'group': group, 'fields': fields}
        product['data'].setdefault('sourceVariants', []).append(variant)
        if 'catalogFields' not in product['data']:
            product['data']['catalogFields'] = fields
    for product in products.values():
        variants = product['data'].get('sourceVariants', [])
        if len({v['title'] for v in variants}) > 1:
            product['data']['sourceIdentityIssue'] = 'The source reuses this SKU for different size or product names. Confirm the physical part identity before approving fitment or stock.'
    # Complete the Tacoma operational package fields and source totals.
    for package in bundle['packages']:
        level = package['sourceKey'].split(':')[-1]
        row = lift_rows[level]
        mapped = row['mapped']
        d = package['data']
        d.update({'useLevel': level, 'sourceRowKey': row['sourceKey'], 'specs': mapped.get('specs', {'recommendedLiftHeight': '', 'stockCoil': '', 'levelingMethod': ''}), 'sourceSummary': mapped.get('sourceTotals', {}), 'sourceDescription': mapped.get('description') or '', 'vehicleQuestions': str(mapped.get('vehicleQuestions') or '').splitlines()})
        components = mapped.get('components', {})
        source_labor = mapped.get('labor', {})
        full_labor = {**d['labor'], 'frontHours': source_labor.get('frontHours'), 'rearHours': source_labor.get('rearHours'), 'rustHours': source_labor.get('rustHours'), 'rustApplies': False, 'useBreakdown': False}
        d['labor'] = full_labor
        by_role = {'Front shocks': 'front', 'Rear shocks': 'rear', 'Strut mounts': 'strutMount', 'Lower mounting hardware': 'lowerBolt', 'Differential drop': 'diffDrop', 'Front suspension': 'front', 'Upper control arms': 'uca', 'Brake lines': 'brakeLines', 'Cam bolt kit': 'camBolt'}
        for line in d['lines']:
            line['unitCostCents'] = components.get(by_role.get(line['role']), {}).get('costCents')
        variants = [{'id': 'front-rear', 'label': 'Front & rear', 'enabled': True, 'lines': d['lines'], 'labor': full_labor}]
        if level == 'weekender':
            front_labor = {**full_labor, 'hours': source_labor.get('frontHours'), 'rearHours': 0}
            variants.insert(0, {'id': 'front-only', 'label': 'Front only', 'enabled': False, 'lines': [l for l in d['lines'] if l['role'] != 'Rear shocks'], 'labor': front_labor})
        d['defaultVariantId'] = 'front-rear'
        d['variants'] = variants
    # Electrical BOM quantities and units are explicit source text, never AI guesses.
    s, f = values_books['electrical'].active, formula_books['electrical'].active
    values, formulas = list(s.iter_rows(values_only=True)), list(f.iter_rows(values_only=True))
    for row_no in range(4, len(values) + 1):
        row = values[row_no-1]
        if not row[0]:
            continue
        item = snapshot(Path(args.electrical).name, s.title, row_no, row, formulas[row_no-1], values[2], ELECTRICAL_FIELDS, source_id, 'electrical', 'Medium')
        rows.append(item)
        standard = next(v for v in bundle['standards'] if v['sourceKey'] == f'electrical-medium:{row_no}')
        bom_lines, labels = [], []
        for line_no, original in enumerate(str(row[4] or '').splitlines()):
            if line_no == 0 or not original.strip():
                continue
            if original.strip().lower().startswith('label:') or original.strip().startswith('Label:') or original.strip().startswith('“'):
                labels.append(original)
                continue
            for piece_no, piece in enumerate(split_bom_components(original)):
                qty, unit, name = quantity_part(piece)
                pn = re.search(r'\bPN\s+([A-Z0-9-]+)', name)
                manufacturer_pn = pn.group(1) if pn else None
                identity = manufacturer_pn or re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
                product_key = 'electrical:' + identity
                if product_key not in products:
                    products[product_key] = {'sourceKey': product_key, 'title': name, 'category': 'Power & electrical', 'data': {'source': Path(args.electrical).name, 'sourceReferences': [{'file': Path(args.electrical).name, 'sheet': s.title, 'row': row_no, 'range': f'E{row_no}'}], 'supplierSku': None, 'manufacturerPartNumber': manufacturer_pn, 'supplier': None, 'unit': unit, 'stockType': 'UNREVIEWED', 'candidateCostCents': None, 'candidateRetailCents': None, 'catalogFields': {'unit': unit}}}
                bom_lines.append({'id': f'r{row_no}-l{line_no}-{piece_no}', 'sourceKey': product_key, 'quantity': qty, 'unit': unit, 'description': name, 'sourceText': original, 'reviewed': False})
        standard['data'].update({'componentType': row[0], 'feedsTo': row[2] or '', 'purpose': row[3] or '', 'bomLines': bom_lines, 'labels': labels, 'sourceRowKey': item['sourceKey'], 'reviewEvidence': '', 'issues': [{'id': 'technical-review', 'message': 'Confirm part numbers, per-build units, kit contents and all wiring against the original standard before use.', 'resolved': False}]})
        if row_no in (6, 9, 14, 15):
            standard['data']['issues'].append({'id': 'source-consistency', 'message': 'Review the source bus references (2126 versus 2300) and monitor-kit overlap. Do not duplicate kit components or assume the wiring reference is correct.', 'resolved': False})
    for product in products.values():
        if 'catalogFields' not in product['data']:
            product['data']['catalogFields'] = {'unit': product['data'].get('unit', 'each'), 'purchaseCostCents': product['data'].get('candidateCostCents'), 'cogsCents': None, 'retailCents': product['data'].get('candidateRetailCents'), 'installedCents': product['data'].get('candidateInstalledCents')}
    bundle['sourceRows'] = rows
    bundle['products'] = list(products.values())
    bundle['fieldDictionary'] = {'flatbed': dict(zip([get_column_letter(i+1) for i in range(len(FLATBED_FIELDS))], FLATBED_FIELDS)), 'weekender': dict(zip([get_column_letter(i+1) for i in range(len(WEEKENDER_FIELDS))], WEEKENDER_FIELDS)), 'light': dict(zip([get_column_letter(i+1) for i in range(len(LIGHT_FIELDS))], LIGHT_FIELDS)), 'heavy': dict(zip([get_column_letter(i+1) for i in range(len(HEAVY_FIELDS))], HEAVY_FIELDS)), 'electrical': dict(zip('ABCDE', ELECTRICAL_FIELDS))}
    bundle['sourceNotes'] = ['Expedition has no populated package data.', 'Overlander(old) remains legacy reference only.', 'Shared flatbed SKUs and copied dimensions require part-identity review.', 'Source promotions remain inactive. No physical stock is imported.']
    for w in list(values_books.values()) + list(formula_books.values()):
        w.close()
    return bundle

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for field in ('lifts', 'flatbeds', 'electrical', 'conventions', 'output'):
        parser.add_argument('--' + field, required=True)
    args = parser.parse_args()
    out = Path(args.output).resolve()
    root = Path(__file__).resolve().parents[1]
    if out == root or root in out.parents:
        raise SystemExit('The source bundle must stay outside the website repository.')
    bundle = build(args)
    out.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    out.write_text(json.dumps(bundle, ensure_ascii=False, indent=2))
    out.chmod(0o600)
    print(json.dumps({'products': len(bundle['products']), 'packages': len(bundle['packages']), 'standards': len(bundle['standards']), 'sourceRows': len(bundle['sourceRows']), 'mapping': 2, 'stockMovements': 0}))
