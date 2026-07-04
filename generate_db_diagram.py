import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

fig, ax = plt.subplots(figsize=(17, 10))
ax.set_xlim(0, 17)
ax.set_ylim(0, 10)
ax.axis('off')
fig.patch.set_facecolor('#1a1a1a')
ax.set_facecolor('#1a1a1a')

ax.text(8.5, 9.65, 'Database Schema — MongoDB Collections',
        ha='center', fontsize=14, fontweight='bold', color='white')
ax.text(8.5, 9.3, 'Forest Fire AI Monitoring Platform',
        ha='center', fontsize=9, color='#888888', style='italic')

def collection(ax, x, y, w, title, header_fields, body_fields, header_color, zorder=3):
    row_h = 0.32
    total_rows = len(header_fields) + len(body_fields)
    box_h = 0.52 + total_rows * row_h + 0.15

    header = FancyBboxPatch((x, y - box_h), w, 0.52,
                            boxstyle="round,pad=0.0",
                            facecolor=header_color, edgecolor='#555555',
                            linewidth=1.5, zorder=zorder)
    ax.add_patch(header)
    ax.text(x + w/2, y - 0.26, title, ha='center', va='center',
            fontsize=11, fontweight='bold', color='white', zorder=zorder+1)

    body = FancyBboxPatch((x, y - box_h), w, box_h - 0.52,
                          boxstyle="round,pad=0.0",
                          facecolor='#252525', edgecolor='#555555',
                          linewidth=1.5, zorder=zorder)
    ax.add_patch(body)

    cy = y - 0.52 - 0.22
    for fname, ftype, is_key in header_fields:
        color = '#f0c040' if is_key == 'pk' else '#aaaaaa'
        prefix = 'PK  ' if is_key == 'pk' else '      '
        ax.text(x + 0.18, cy, prefix + fname, ha='left', va='center',
                fontsize=8, color=color, fontweight='bold', zorder=zorder+1)
        ax.text(x + w - 0.15, cy, ftype, ha='right', va='center',
                fontsize=7.5, color='#888888', zorder=zorder+1)
        cy -= row_h

    ax.plot([x + 0.1, x + w - 0.1], [cy + row_h*0.5, cy + row_h*0.5],
            color='#444444', lw=0.8, zorder=zorder+1)

    for fname, ftype, is_key in body_fields:
        color = '#e08060' if is_key == 'fk' else ('#aaddaa' if is_key == 'embed' else '#cccccc')
        prefix = 'FK  ' if is_key == 'fk' else ('      ' if is_key == 'embed' else '      ')
        ax.text(x + 0.18, cy, prefix + fname, ha='left', va='center',
                fontsize=8, color=color, zorder=zorder+1)
        ax.text(x + w - 0.15, cy, ftype, ha='right', va='center',
                fontsize=7.5, color='#888888', zorder=zorder+1)
        cy -= row_h

    return x + w/2, y, x + w/2, y - box_h

def rel_line(ax, x1, y1, x2, y2, label=''):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='#e08060', lw=1.5,
                                linestyle='dashed'), zorder=8)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx + 0.1, my, label, ha='left', va='center',
                fontsize=7.5, color='#e08060', style='italic', zorder=9)

collection(ax, 0.5, 9.1, 4.2, 'users',
    [('_id', 'ObjectId', 'pk')],
    [('name',     'String',  ''),
     ('email',    'String (unique)', ''),
     ('password', 'String (hashed)', ''),
     ('role',     'enum: user|admin|worker', ''),
     ('createdAt','Date',    ''),
     ('updatedAt','Date',    '')],
    '#1a3a5c')

collection(ax, 5.8, 9.1, 5.4, 'cameras',
    [('_id', 'ObjectId', 'pk')],
    [('name',                    'String',   ''),
     ('location',                'String',   ''),
     ('region',                  'String',   ''),
     ('sourceUrl',               'String',   ''),
     ('isActive',                'Boolean',  ''),
     ('status',                  'enum: active|inactive|error', ''),
     ('analysisIntervalSeconds', 'Number',   ''),
     ('confidenceThreshold',     'Number',   ''),
     ('latestDetection',         'Object (embedded)', 'embed'),
     ('  .timestamp',            'String',   ''),
     ('  .snapshotUrl',          'String',   ''),
     ('  .videoTimestampMs',     'Number',   ''),
     ('  .riskLevel',            'enum: none|low|med|high|crit', ''),
     ('  .detections[]',         'Array of DetectionItem', 'embed'),
     ('    .class',              'String',   ''),
     ('    .confidence',         'Number',   ''),
     ('    .bbox',               'Number[]', ''),
     ('createdAt',               'Date',     ''),
     ('updatedAt',               'Date',     '')],
    '#2a4a1a')

collection(ax, 12.2, 9.1, 4.3, 'alerts',
    [('_id', 'ObjectId', 'pk')],
    [('cameraId',          'String (Camera._id)', 'fk'),
     ('detectionTimestamp','String',  ''),
     ('type',              'enum: fire|smoke|fire_and_smoke', ''),
     ('maxConfidence',     'Number',  ''),
     ('riskLevel',         'enum: low|medium|high|critical', ''),
     ('alertSnapshotUrl',  'String',  ''),
     ('status',            'enum: pending|acknowledged|resolved', ''),
     ('note',              'String',  ''),
     ('createdAt',         'Date',    ''),
     ('updatedAt',         'Date',    '')],
    '#4a1a1a')

rel_line(ax, 12.2, 5.5, 11.2, 5.5, 'references cameras._id')

legend_items = [
    ('#f0c040', 'Primary Key (PK)'),
    ('#e08060', 'Foreign Key / Reference (FK)'),
    ('#aaddaa', 'Embedded Sub-document'),
    ('#cccccc', 'Regular Field'),
]
for i, (color, label) in enumerate(legend_items):
    ax.plot(0.6, 0.7 - i*0.3, 's', color=color, markersize=8, zorder=5)
    ax.text(0.9, 0.7 - i*0.3, label, va='center', fontsize=8, color='#cccccc')

plt.tight_layout(pad=0.3)
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/diagram_db.png',
            dpi=150, bbox_inches='tight', facecolor='#1a1a1a')
plt.close()
print('Saved diagram_db.png')
