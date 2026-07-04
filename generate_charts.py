import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

epochs = list(range(1, 81))

box_loss = [1.965,1.975,1.971,1.93,1.887,1.875,1.843,1.838,1.815,1.8,1.78,1.77,1.76,1.739,1.749,1.745,1.734,1.728,1.728,1.719,1.711,1.688,1.687,1.692,1.683,1.68,1.668,1.667,1.662,1.653,1.65,1.636,1.634,1.644,1.628,1.617,1.611,1.607,1.6,1.593,1.585,1.572,1.575,1.563,1.562,1.563,1.549,1.553,1.53,1.528,1.519,1.502,1.51,1.502,1.504,1.488,1.485,1.475,1.477,1.457,1.467,1.439,1.443,1.432,1.427,1.423,1.424,1.405,1.407,1.403,1.35,1.33,1.311,1.309,1.308,1.297,1.283,1.273,1.278,1.268]
cls_loss = [2.655,2.441,2.41,2.379,2.285,2.245,2.214,2.204,2.18,2.135,2.104,2.081,2.073,2.046,2.065,2.015,1.998,1.966,1.99,1.946,1.946,1.939,1.921,1.902,1.894,1.873,1.861,1.854,1.843,1.817,1.826,1.814,1.811,1.808,1.787,1.743,1.73,1.73,1.722,1.71,1.684,1.67,1.656,1.631,1.636,1.631,1.597,1.597,1.575,1.568,1.549,1.523,1.527,1.507,1.501,1.473,1.47,1.447,1.441,1.428,1.419,1.404,1.405,1.378,1.372,1.355,1.353,1.322,1.323,1.319,1.174,1.136,1.114,1.098,1.086,1.083,1.062,1.041,1.039,1.025]
dfl_loss = [1.952,1.993,1.975,1.947,1.903,1.889,1.871,1.877,1.868,1.84,1.83,1.822,1.808,1.789,1.812,1.79,1.78,1.774,1.778,1.761,1.75,1.752,1.745,1.74,1.737,1.738,1.738,1.723,1.728,1.718,1.724,1.71,1.705,1.711,1.692,1.68,1.673,1.678,1.673,1.666,1.658,1.645,1.646,1.634,1.635,1.635,1.628,1.629,1.618,1.615,1.603,1.587,1.593,1.589,1.586,1.576,1.57,1.566,1.564,1.546,1.556,1.543,1.543,1.534,1.526,1.523,1.524,1.507,1.51,1.503,1.468,1.455,1.438,1.44,1.438,1.428,1.423,1.411,1.415,1.409]
mAP50 = [0.194,0.188,0.197,0.234,0.277,0.296,0.292,0.304,0.339,0.317,0.344,0.337,0.335,0.345,0.352,0.361,0.364,0.373,0.369,0.391,0.386,0.395,0.394,0.395,0.408,0.41,0.412,0.41,0.416,0.427,0.415,0.428,0.421,0.425,0.431,0.437,0.435,0.421,0.434,0.442,0.446,0.43,0.432,0.445,0.442,0.438,0.436,0.449,0.452,0.449,0.443,0.445,0.441,0.455,0.448,0.454,0.45,0.444,0.441,0.448,0.448,0.447,0.454,0.446,0.44,0.447,0.44,0.446,0.446,0.44,0.441,0.44,0.436,0.437,0.437,0.433,0.432,0.43,0.435,0.433]
mAP50_95 = [0.0695,0.0661,0.0694,0.0897,0.109,0.116,0.112,0.122,0.138,0.135,0.142,0.136,0.141,0.142,0.147,0.153,0.153,0.158,0.159,0.168,0.166,0.17,0.17,0.17,0.177,0.18,0.18,0.177,0.18,0.19,0.18,0.185,0.18,0.186,0.189,0.193,0.193,0.187,0.19,0.196,0.197,0.19,0.192,0.197,0.197,0.194,0.196,0.198,0.2,0.196,0.196,0.197,0.194,0.201,0.195,0.199,0.198,0.195,0.193,0.196,0.197,0.196,0.199,0.194,0.191,0.194,0.193,0.195,0.196,0.192,0.192,0.192,0.191,0.191,0.191,0.191,0.19,0.188,0.19,0.19]
precision = [0.258,0.272,0.277,0.306,0.321,0.369,0.362,0.377,0.432,0.378,0.414,0.392,0.407,0.418,0.407,0.424,0.441,0.442,0.455,0.459,0.444,0.465,0.461,0.474,0.468,0.486,0.501,0.481,0.473,0.482,0.487,0.483,0.473,0.505,0.482,0.502,0.509,0.479,0.492,0.496,0.504,0.466,0.483,0.478,0.497,0.487,0.494,0.501,0.495,0.495,0.493,0.483,0.492,0.495,0.497,0.508,0.515,0.499,0.493,0.521,0.489,0.494,0.489,0.513,0.492,0.497,0.506,0.514,0.508,0.506,0.513,0.502,0.501,0.505,0.521,0.514,0.512,0.52,0.515,0.499]
recall = [0.306,0.288,0.304,0.316,0.413,0.355,0.358,0.358,0.396,0.394,0.389,0.4,0.384,0.417,0.42,0.418,0.401,0.426,0.413,0.426,0.424,0.432,0.417,0.441,0.44,0.429,0.424,0.427,0.453,0.448,0.44,0.45,0.443,0.429,0.462,0.463,0.455,0.456,0.464,0.456,0.472,0.47,0.466,0.488,0.471,0.472,0.459,0.48,0.487,0.481,0.464,0.479,0.475,0.486,0.474,0.472,0.478,0.475,0.475,0.452,0.482,0.49,0.511,0.476,0.479,0.487,0.469,0.472,0.474,0.472,0.467,0.475,0.482,0.478,0.47,0.465,0.471,0.457,0.461,0.478]

plt.style.use('seaborn-v0_8-whitegrid')

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(epochs, box_loss, label='Box Loss', linewidth=2, color='#e74c3c')
ax.plot(epochs, cls_loss, label='Class Loss', linewidth=2, color='#3498db')
ax.plot(epochs, dfl_loss, label='DFL Loss', linewidth=2, color='#2ecc71')
ax.axvline(x=70, color='gray', linestyle='--', linewidth=1, alpha=0.7, label='Mosaic disabled (epoch 70)')
ax.set_xlabel('Epoch', fontsize=12)
ax.set_ylabel('Loss', fontsize=12)
ax.set_title('Training Loss over 80 Epochs', fontsize=14, fontweight='bold')
ax.legend(fontsize=10)
ax.set_xlim(1, 80)
plt.tight_layout()
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/training_loss.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved training_loss.png')

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(epochs, mAP50, label='mAP@50', linewidth=2.5, color='#e74c3c')
ax.plot(epochs, mAP50_95, label='mAP@50-95', linewidth=2.5, color='#3498db')
ax.plot(epochs, precision, label='Precision', linewidth=1.5, color='#f39c12', linestyle='--', alpha=0.8)
ax.plot(epochs, recall, label='Recall', linewidth=1.5, color='#9b59b6', linestyle='--', alpha=0.8)
best_epoch = mAP50.index(max(mAP50)) + 1
ax.axvline(x=best_epoch, color='gray', linestyle=':', linewidth=1.5, label=f'Best mAP50 (epoch {best_epoch})')
ax.set_xlabel('Epoch', fontsize=12)
ax.set_ylabel('Score', fontsize=12)
ax.set_title('Validation Metrics over 80 Epochs', fontsize=14, fontweight='bold')
ax.legend(fontsize=10)
ax.set_xlim(1, 80)
ax.set_ylim(0, 0.7)
plt.tight_layout()
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/validation_metrics.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved validation_metrics.png')

categories = ['Fire', 'Smoke', 'Overall']
map50_vals = [0.544, 0.366, 0.455]
map5095_vals = [0.249, 0.153, 0.201]
precision_vals = [0.525, 0.465, 0.495]
recall_vals = [0.572, 0.398, 0.485]

x = np.arange(len(categories))
width = 0.2

fig, ax = plt.subplots(figsize=(9, 5))
ax.bar(x - 1.5*width, map50_vals, width, label='mAP@50', color='#e74c3c', alpha=0.85)
ax.bar(x - 0.5*width, map5095_vals, width, label='mAP@50-95', color='#3498db', alpha=0.85)
ax.bar(x + 0.5*width, precision_vals, width, label='Precision', color='#f39c12', alpha=0.85)
ax.bar(x + 1.5*width, recall_vals, width, label='Recall', color='#9b59b6', alpha=0.85)

for bars in ax.containers:
    ax.bar_label(bars, fmt='%.3f', fontsize=8, padding=2)

ax.set_ylabel('Score', fontsize=12)
ax.set_title('Final Model Performance by Class', fontsize=14, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(categories, fontsize=12)
ax.legend(fontsize=10)
ax.set_ylim(0, 0.75)
plt.tight_layout()
plt.savefig('C:/Users/Andrei/Desktop/ForestFireAI/final_metrics.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved final_metrics.png')
print('All charts generated.')
