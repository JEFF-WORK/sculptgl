define([
  'lib/glMatrix',
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (glm, Utils, Tablet, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;

  function Paint(states) {
    SculptBase.call(this, states);
    this.hardness_ = 0.75;
    this.intensity_ = 0.75; // deformation intensity
    this.culling_ = false; // if we backface cull the vertices
    this.color_ = vec3.fromValues(1.0, 0.766, 0.336); // albedo
    this.material_ = vec3.fromValues(0.3, 0.95, 0.0); // roughness/metallic/masking
    this.pickColor_ = false; // color picking
    this.global_ = false; // global material
    this.pickCallback_ = null; // callback function after picking a color
  }

  Paint.prototype = {
    /** Push undo operation */
    pushState: function () {
      if (!this.pickColor_)
        this.states_.pushStateColorAndMaterial(this.mesh_);
    },
    /** Start sculpting operation */
    startSculpt: function (main) {
      var picking = main.getPicking();
      if (this.pickColor_)
        return this.pickColor(picking);
      this.update(main);
    },
    /** Update sculpting operation */
    update: function (main) {
      if (this.pickColor_ === true)
        return this.updatePickColor(main);
      this.sculptStroke(main);
    },
    updateContinuous: function (main) {
      if (this.pickColor_ === true)
        return this.updatePickColor(main);
      SculptBase.prototype.updateContinuous.call(this, main);
    },
    updateMeshBuffers: function () {
      if (this.mesh_.getDynamicTopology) {
        this.mesh_.updateBuffers();
      } else {
        this.mesh_.updateColorBuffer();
        this.mesh_.updateMaterialBuffer();
      }
    },
    updatePickColor: function (main) {
      var picking = main.getPicking();
      picking.intersectionMouseMesh(this.mesh_, main.mouseX_, main.mouseY_);
      if (picking.getMesh())
        this.pickColor(picking);
    },
    /** Pick the color under the mouse */
    setPickCallback: function (cb) {
      this.pickCallback_ = cb;
    },
    /** Pick the color under the mouse */
    pickColor: function (picking) {
      var color = this.color_;
      picking.polyLerp(this.mesh_.getMaterials(), color);
      var roughness = color[0];
      var metallic = color[1];
      picking.polyLerp(this.mesh_.getColors(), color);
      this.pickCallback_(color, roughness, metallic);
    },
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.paint(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, this.hardness_);

      this.mesh_.updateDuplicateColorsAndMaterials(iVertsInRadius);
      this.mesh_.updateFlatShading(this.mesh_.getFacesFromVertices(iVertsInRadius));
    },
    /** Paint color vertices */
    paint: function (iVerts, center, radiusSquared, intensity, hardness) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();
      var color = this.color_;
      var roughness = this.material_[0];
      var metallic = this.material_[1];
      var radius = Math.sqrt(radiusSquared);
      var cr = color[0];
      var cg = color[1];
      var cb = color[2];
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var softness = 2 * (1 - hardness);
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = Math.pow(1 - dist, softness);
        fallOff *= intensity;
        fallOff *= mAr[ind + 2];
        var fallOffCompl = 1.0 - fallOff;
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
        mAr[ind] = mAr[ind] * fallOffCompl + roughness * fallOff;
        mAr[ind + 1] = mAr[ind + 1] * fallOffCompl + metallic * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Paint);

  return Paint;
});