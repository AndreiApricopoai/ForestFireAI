import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

fig, ax = plt.subplots(figsize=(18, 11))
ax.set_xlim(0, 18)
ax.set_ylim(0, 11)
ax.axis('off')
fig.patch.set_facecolor('#1a1a1a')
ax.set_facecolor('#1a1a1a')

def dark_box(ax, x, y, w, h, title, lines=[], title_color='white', accent=None, zorder=3):
    bg = '#2a2a2a' if accent is None else accent
    box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                         boxstyle="round,pad=0.04",
                         facecolor=bg, edgecolor='#444444',
                         linewidth=1.5, zorder=zorder)
    ax.add_patch(box)
    top = y + h/2 - 0.18
    ax.text(x, top, title, ha='center', va='top',
            fontsize=10, fontweight='bold', color=title_color, zorder=zorder+1)
    for i, line in enumerate(lines):
        col = '#aaaaaa' if not line.startswith('*') else '#6ab0e0'
        label = line.lstrip('*')
        ax.text(x, top - 0.32 - i*0.25, label, ha='center', va='top',
                fontsize=7.8, color=col, zorder=zorder+1)

def arr(ax, x1, y1, x2, y2, label='', color='#666666', lw=1.4, ls='-'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=lw,
                                linestyle=ls), zorder=6)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my + 0.08, label, ha='center', va='bottom',
                fontsize=7.5, color=color, style='italic', zorder=7)

ax.text(0.4, 10.6, 'System Architecture', ha='left', va='center',
        fontsize=15, fontweight='bold', color='white')
ax.text(0.4, 10.25, 'Forest Fire AI Monitoring Platform — Current State',
        ha='left', va='center', fontsize=9, color='#888888', style='italic')

dark_box(ax, 2.4, 9.1, 2.8, 0.8,
         'Video Source',
         ['cameras/*.mp4', 'Static files simulating live feeds'],
         accent='#252525')

dark_box(ax, 2.4, 6.6, 2.8, 3.4,
         'Python Worker',
         ['FastAPI  ·  YOLOv8',
          'OpenCV  ·  threading',
          '─────────────────',
          '*1 thread per camera',
          'Configurable frame interval',
          'JPEG annotated snapshots',
          '─────────────────',
          'Bearer token auth',
          'FastAPI control API'],
         title_color='#7ec8a0',
         accent='#1e2e24')

dark_box(ax, 2.4, 4.05, 2.8, 1.0,
         'snapshots/',
         ['JPEG · latest frame per camera', 'Overwritten on each detection'],
         accent='#252525')

dark_box(ax, 2.4, 2.6, 2.8, 1.0,
         'alerts/',
         ['JPEG · one file per alert event', 'Organised by camera ID'],
         accent='#252525')

dark_box(ax, 8.8, 5.8, 3.8, 7.8,
         'NestJS Backend',
         ['REST API  ·  Socket.IO',
          'Mongoose  ·  JWT  ·  Passport',
          '─────────────────────',
          '*Auth & Role-based guards',
          '  (user / admin / worker)',
          '*Cameras CRUD',
          '*Worker control API',
          '  (start / stop threads)',
          '*Detection processing',
          '  + risk level calculation',
          '*Alert threshold logic',
          '  fire >70%  |  smoke >70%',
          '  5 min cooldown per camera',
          '*Alert image copy to alerts/',
          '*Static file serving',
          '  /snapshots  /alerts  /cameras',
          '*WebSocket gateway',
          '  camera rooms + admins room'],
         title_color='#e0c070',
         accent='#2a2510')

dark_box(ax, 14.5, 8.8, 3.0, 1.8,
         'MongoDB Atlas',
         ['*Camera document',
          '  config + latestDetection',
          '*Alert document',
          '  snapshot URL · risk · status',
          '*User document'],
         title_color='#88cc88',
         accent='#1a2a1a')

dark_box(ax, 14.5, 5.5, 3.0, 4.6,
         'React Frontend',
         ['Material UI v9  ·  Redux Toolkit',
          'React Router  ·  Socket.IO client',
          '─────────────────────',
          '*Dashboard  (live camera cards)',
          '*Camera detail dialog',
          '  Detection tab + Live video tab',
          '*Admin panel — manage cameras',
          '*Alerts page (admin only)',
          '  Real-time + history + pagination',
          '*Room-based WS subscriptions',
          '*Role-based access control'],
         title_color='#70a8e0',
         accent='#101828')

arr(ax, 2.4, 8.7, 2.4, 7.95, '', '#555555')
arr(ax, 3.8, 6.9, 6.9, 6.1, 'POST /detections\n(Bearer token)', '#7ec8a0', lw=1.5)
arr(ax, 3.8, 4.05, 6.9, 4.8, 'serves /snapshots', '#888888', ls='--')
arr(ax, 3.8, 2.6, 6.9, 3.8, 'serves /alerts', '#888888', ls='--')

arr(ax, 7.7, 7.5, 6.95, 7.5, '', '#555555')
ax.annotate('', xy=(6.95, 2.6), xytext=(7.7, 2.6),
            arrowprops=dict(arrowstyle='->', color='#555555', lw=1.4), zorder=6)
ax.text(7.1, 5.1, 'copies alert\nimage', ha='center', fontsize=7.2,
        color='#888888', style='italic')

arr(ax, 10.7, 8.2, 13.0, 8.9, 'Mongoose\nRead / Write', '#88cc88', lw=1.4)
arr(ax, 10.7, 5.8, 13.0, 6.5,
    'Socket.IO\ndetection:new\nalert:new', '#5090cc', lw=1.8)
arr(ax, 13.0, 5.0, 10.7, 4.8, 'REST API calls\n(auth / cameras / alerts)', '#888888', ls='--')

ax.plot([2.4, 2.4], [4.6, 3.1], color='#555555', lw=1.4, zorder=5)
ax.annotate('', xy=(2.4, 3.1), xytext=(2.4, 3.15),
            arrowprops=dict(arrowstyle='->', color='#555555', lw=1.4), zorder=6)

plt.tight_layout(pad=0.5)
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/diagram_system.png',
            dpi=150, bbox_inches='tight', facecolor='#1a1a1a')
plt.close()
print('Saved diagram_system.png')
