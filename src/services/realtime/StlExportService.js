import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

class StlExportService {
  constructor() {
    this.exporter = new STLExporter();
  }

  exportSceneObject(object3d, fileName = 'caredroid-anatomy.stl') {
    if (!object3d) throw new Error('No object provided for STL export');

    const stlText = this.exporter.parse(object3d, { binary: false });
    const blob = new Blob([stlText], { type: 'model/stl' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(url);
    return { success: true, bytes: blob.size, fileName };
  }
}

let instance = null;

export function getStlExportService() {
  if (!instance) instance = new StlExportService();
  return instance;
}

export default StlExportService;
