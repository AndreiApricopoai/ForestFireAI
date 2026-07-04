import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def rounded_box(ax, x, y, w, h, color, label, sublabel=None, fontsize=10, text_color='white', zorder=3):
    box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                         boxstyle="round,pad=0.02",
                         facecolor=color, edgecolor='white', linewidth=1.5, zorder=zorder)
    ax.add_patch(box)
    if sublabel:
        ax.text(x, y + h*0.12, label, ha='center', va='center', fontsize=fontsize,
                fontweight='bold', color=text_color, zorder=zorder+1)
        ax.text(x, y - h*0.18, sublabel, ha='center', va='center', fontsize=fontsize-1.5,
                color=text_color, alpha=0.85, style='italic', zorder=zorder+1)
    else:
        ax.text(x, y, label, ha='center', va='center', fontsize=fontsize,
                fontweight='bold', color=text_color, zorder=zorder+1)

def dashed_box(ax, x, y, w, h, color, label, sublabel=None, fontsize=9):
    box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                         boxstyle="round,pad=0.02",
                         facecolor=color, edgecolor='#888888',
                         linewidth=1.5, linestyle='--', zorder=2)
    ax.add_patch(box)
    if sublabel:
        ax.text(x, y + h*0.12, label, ha='center', va='center', fontsize=fontsize,
                fontweight='bold', color='white', zorder=3)
        ax.text(x, y - h*0.18, sublabel, ha='center', va='center', fontsize=fontsize-1.5,
                color='white', alpha=0.85, style='italic', zorder=3)
    else:
        ax.text(x, y, label, ha='center', va='center', fontsize=fontsize,
                fontweight='bold', color='white', zorder=3)

def arrow(ax, x1, y1, x2, y2, label='', color='#555555', lw=1.5, style='->'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw), zorder=4)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my, label, ha='center', va='bottom', fontsize=7.5,
                color='#333333', style='italic', zorder=5)

def dashed_arrow(ax, x1, y1, x2, y2, label=''):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='#777777', lw=1.3,
                                linestyle='dashed'), zorder=4)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my+0.05, label, ha='center', va='bottom', fontsize=7,
                color='#555555', style='italic', zorder=5)

def person(ax, x, y, label, sublabel=None, color='#1a3a5c'):
    circle = plt.Circle((x, y+0.55), 0.22, color=color, zorder=3)
    ax.add_patch(circle)
    ax.plot([x, x], [y+0.33, y-0.1], color=color, lw=3, zorder=3)
    ax.plot([x-0.28, x+0.28], [y+0.15, y+0.15], color=color, lw=3, zorder=3)
    ax.plot([x, x-0.22], [y-0.1, y-0.55], color=color, lw=3, zorder=3)
    ax.plot([x, x+0.22], [y-0.1, y-0.55], color=color, lw=3, zorder=3)
    ax.text(x, y-0.78, label, ha='center', va='top', fontsize=9,
            fontweight='bold', color='#1a1a1a', zorder=4)
    if sublabel:
        ax.text(x, y-1.02, sublabel, ha='center', va='top', fontsize=7.5,
                color='#555555', style='italic', zorder=4)

# ─────────────────────────────────────────────
# C1 — CONTEXT DIAGRAM
# ─────────────────────────────────────────────

fig, ax = plt.subplots(figsize=(13, 9))
ax.set_xlim(0, 13); ax.set_ylim(0, 9)
ax.axis('off')
fig.patch.set_facecolor('#f4f6f9')
ax.set_facecolor('#f4f6f9')
ax.text(6.5, 8.65, 'C1 — System Context Diagram', ha='center', va='center',
        fontsize=14, fontweight='bold', color='#1a1a1a')
ax.text(6.5, 8.3, 'Forest Fire AI Monitoring Platform', ha='center', va='center',
        fontsize=10, color='#555555', style='italic')

person(ax, 2.2, 6.2, 'Admin User', '[Person]')
person(ax, 2.2, 2.8, 'Regular User', '[Person]')

rounded_box(ax, 6.5, 4.5, 3.2, 2.0, '#1a3a5c',
            'Forest Fire AI Platform', '[Software System]\nReceives video input, runs detection,\nstores results and sends real-time alerts',
            fontsize=9)

dashed_box(ax, 10.8, 6.5, 2.0, 1.0, '#4a4a6a', 'MongoDB Atlas',
           '[External System]\nCloud database', fontsize=8)
dashed_box(ax, 10.8, 4.5, 2.0, 1.0, '#4a4a6a', 'Video Files',
           '[Local Storage]\nCamera simulation', fontsize=8)
dashed_box(ax, 10.8, 2.5, 2.0, 1.0, '#4a4a6a', 'YOLOv8 Model',
           '[Local File]\nbest.pt weights', fontsize=8)

arrow(ax, 3.05, 6.5, 4.85, 5.1, 'Views dashboard,\nmanages cameras\nand reviews alerts')
arrow(ax, 3.05, 3.0, 4.85, 4.0, 'Views dashboard\nand camera feeds')
dashed_arrow(ax, 7.95, 5.1, 9.8, 6.5, 'Reads/Writes')
dashed_arrow(ax, 7.95, 4.5, 9.8, 4.5, 'Reads video frames')
dashed_arrow(ax, 7.95, 3.9, 9.8, 2.8, 'Loads model weights')

plt.tight_layout()
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/diagram_c1.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved diagram_c1.png')

# ─────────────────────────────────────────────
# C2 — CONTAINER DIAGRAM
# ─────────────────────────────────────────────

fig, ax = plt.subplots(figsize=(15, 10))
ax.set_xlim(0, 15); ax.set_ylim(0, 10)
ax.axis('off')
fig.patch.set_facecolor('#f4f6f9')
ax.set_facecolor('#f4f6f9')

ax.text(7.5, 9.65, 'C2 — Container Diagram', ha='center', fontsize=14,
        fontweight='bold', color='#1a1a1a')
ax.text(7.5, 9.3, 'Forest Fire AI Monitoring Platform', ha='center', fontsize=10,
        color='#555555', style='italic')

person(ax, 1.1, 7.5, 'Admin User', '[Person]')
person(ax, 1.1, 3.5, 'Regular User', '[Person]')

boundary = FancyBboxPatch((2.6, 0.8), 9.6, 8.0,
                          boxstyle="round,pad=0.1",
                          facecolor='#e8edf5', edgecolor='#3a5a8c',
                          linewidth=2, linestyle='-', zorder=1)
ax.add_patch(boundary)
ax.text(7.4, 8.65, 'System Boundary', ha='center', fontsize=8.5,
        color='#3a5a8c', style='italic')

rounded_box(ax, 7.4, 7.5, 3.0, 1.1, '#2563a8',
            'Frontend', '[Container: React / TypeScript]\nDashboard, alerts page, admin panel',
            fontsize=8.5)

rounded_box(ax, 7.4, 5.2, 3.0, 1.1, '#1a3a5c',
            'Backend Server', '[Container: NestJS / Node.js]\nAuth, cameras, detections, alerts,\nWebSocket gateway',
            fontsize=8.5)

rounded_box(ax, 4.0, 2.8, 2.6, 1.1, '#1a5c3a',
            'Python Worker', '[Container: FastAPI / Python]\nReads video frames, runs YOLOv8,\nsends detections to backend',
            fontsize=8.5)

rounded_box(ax, 7.4, 2.8, 2.6, 1.1, '#5c3a1a',
            'MongoDB Atlas', '[Container: Database]\nStores cameras, users,\nlatest detections and alerts',
            fontsize=8.5)

rounded_box(ax, 10.8, 2.8, 2.6, 1.1, '#4a1a5c',
            'File Storage', '[Container: Local Folders]\nsnapshots/, alerts/,\ncameras/ video files',
            fontsize=8.5)

arrow(ax, 1.9, 7.8, 5.85, 7.7, 'HTTPS / WebSocket')
arrow(ax, 1.9, 3.8, 5.85, 6.8, 'HTTPS / WebSocket')
arrow(ax, 7.4, 6.95, 7.4, 5.75, 'REST API +\nSocket.IO')
arrow(ax, 6.85, 4.65, 5.25, 3.35, 'HTTP POST\n/detections\n(Bearer token)')
arrow(ax, 7.4, 4.65, 7.4, 3.35, 'Read / Write')
arrow(ax, 8.7, 4.65, 10.0, 3.35, 'Serve static\nfiles')
arrow(ax, 4.85, 2.8, 6.1, 2.8, 'Saves snapshots\nand alert images')
arrow(ax, 10.0, 2.4, 5.25, 2.4, 'Reads video files')

dashed_box(ax, 13.5, 2.8, 1.6, 1.0, '#4a4a6a', 'YOLOv8 Model',
           '[Local File]\nbest.pt', fontsize=8)
dashed_arrow(ax, 12.1, 2.8, 11.9, 2.8)
ax.annotate('', xy=(5.25, 2.55), xytext=(4.0, 2.25),
            arrowprops=dict(arrowstyle='->', color='#777777', lw=1.3, linestyle='dashed'), zorder=4)
ax.text(4.5, 1.95, 'Loads model', ha='center', fontsize=7, color='#555555', style='italic')

plt.tight_layout()
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/diagram_c2.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved diagram_c2.png')

# ─────────────────────────────────────────────
# USE CASE DIAGRAM
# ─────────────────────────────────────────────

def oval(ax, x, y, w, h, label, color='#e07b00', fontsize=8):
    ell = mpatches.Ellipse((x, y), w, h, facecolor=color, edgecolor='white',
                           linewidth=1.5, zorder=3)
    ax.add_patch(ell)
    lines = label.split('\n')
    for i, line in enumerate(lines):
        offset = (len(lines)-1)*0.06 - i*0.12
        ax.text(x, y+offset, line, ha='center', va='center', fontsize=fontsize,
                color='white', fontweight='bold', zorder=4)

def uc_line(ax, x1, y1, x2, y2):
    ax.plot([x1, x2], [y1, y2], color='#333333', lw=1.2, zorder=2)

def uc_arrow(ax, x1, y1, x2, y2, label='', style='dashed'):
    ls = 'dashed' if style == 'dashed' else 'solid'
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='#444444', lw=1.2,
                                linestyle=ls), zorder=4)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my+0.07, label, ha='center', fontsize=7,
                color='#333333', style='italic', zorder=5)

fig, ax = plt.subplots(figsize=(16, 11))
ax.set_xlim(0, 16); ax.set_ylim(0, 11)
ax.axis('off')
fig.patch.set_facecolor('#f4f6f9')
ax.set_facecolor('#f4f6f9')

ax.text(8, 10.65, 'Use Case Diagram — Forest Fire AI Platform',
        ha='center', fontsize=14, fontweight='bold', color='#1a1a1a')

boundary2 = FancyBboxPatch((3.0, 0.5), 10.0, 9.6,
                           boxstyle="round,pad=0.1",
                           facecolor='#eef2f7', edgecolor='#3a5a8c',
                           linewidth=2, zorder=1)
ax.add_patch(boundary2)
ax.text(8.0, 10.0, 'Forest Fire AI Platform', ha='center', fontsize=9,
        color='#3a5a8c', style='italic')

person(ax, 1.4, 7.8, 'Admin', '[Administrator]', color='#1a3a5c')
person(ax, 1.4, 3.2, 'Regular User', '[User]', color='#1a5c3a')
person(ax, 14.5, 5.5, 'Python Worker', '[Service]', color='#5c3a1a')

oval(ax, 6.0, 9.2, 2.6, 0.55, 'Register')
oval(ax, 6.0, 8.3, 2.6, 0.55, 'Login')
oval(ax, 9.5, 9.2, 2.6, 0.55, 'View Dashboard')
oval(ax, 9.5, 8.3, 2.6, 0.55, 'View Camera Feed')
oval(ax, 9.5, 7.3, 2.6, 0.55, 'View Camera Details')

oval(ax, 6.5, 6.1, 2.8, 0.55, 'View Alerts', color='#1a3a8c')
oval(ax, 9.5, 6.1, 2.8, 0.55, 'Review / Resolve Alert', color='#1a3a8c')
oval(ax, 6.5, 5.1, 2.8, 0.55, 'Manage Cameras', color='#1a3a8c')
oval(ax, 9.5, 5.1, 2.8, 0.55, 'Add / Edit / Delete Camera', color='#1a3a8c')
oval(ax, 8.0, 4.0, 2.8, 0.55, 'Activate / Deactivate Camera', color='#1a3a8c')

oval(ax, 8.0, 2.8, 2.8, 0.55, 'Send Detection Result', color='#7a3a00')
oval(ax, 8.0, 1.8, 2.8, 0.55, 'Authenticate with Token', color='#7a3a00')

uc_line(ax, 2.15, 8.3, 4.7, 9.2)
uc_line(ax, 2.15, 8.1, 4.7, 8.3)
uc_line(ax, 2.15, 7.9, 8.2, 9.2)
uc_line(ax, 2.15, 7.7, 8.2, 8.3)
uc_line(ax, 2.15, 7.5, 8.2, 7.3)
uc_line(ax, 2.15, 6.8, 5.1, 6.1)
uc_line(ax, 2.15, 6.5, 5.1, 5.1)

uc_line(ax, 2.15, 3.5, 4.7, 9.2)
uc_line(ax, 2.15, 3.3, 4.7, 8.3)
uc_line(ax, 2.15, 3.1, 8.2, 9.2)
uc_line(ax, 2.15, 2.9, 8.2, 8.3)
uc_line(ax, 2.15, 2.7, 8.2, 7.3)

uc_line(ax, 13.8, 5.5, 9.4, 2.8)
uc_line(ax, 13.8, 5.3, 9.4, 1.8)

uc_arrow(ax, 7.9, 6.1, 8.65, 6.1, '«include»')
uc_arrow(ax, 7.95, 5.1, 8.65, 5.1, '«include»')
uc_arrow(ax, 8.0, 2.52, 8.0, 2.1, '«include»')

plt.tight_layout()
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/diagram_usecase.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved diagram_usecase.png')
print('All diagrams generated.')
