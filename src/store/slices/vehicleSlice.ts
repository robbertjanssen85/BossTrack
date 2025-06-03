import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VehicleState } from '../../types/app';
import { OTMVehicle } from '../../types/otm5';

const initialState: VehicleState = {
  currentVehicle: null,
  registeredVehicles: [],
  licensePlate: '',
  isVehicleRegistered: false,
};

export const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    setLicensePlate: (state, action: PayloadAction<string>) => {
      state.licensePlate = action.payload.toUpperCase().trim();
    },
    registerVehicle: (state, action: PayloadAction<OTMVehicle>) => {
      const vehicle = action.payload;
      const existingIndex = state.registeredVehicles.findIndex(v => v.vehicleId === vehicle.vehicleId);
      
      if (existingIndex >= 0) {
        state.registeredVehicles[existingIndex] = vehicle;
      } else {
        state.registeredVehicles.push(vehicle);
      }
      
      state.currentVehicle = vehicle;
      state.isVehicleRegistered = true;
      state.licensePlate = vehicle.licensePlate;
    },
    selectVehicle: (state, action: PayloadAction<string>) => {
      const vehicleId = action.payload;
      const vehicle = state.registeredVehicles.find(v => v.vehicleId === vehicleId);
      
      if (vehicle) {
        state.currentVehicle = vehicle;
        state.licensePlate = vehicle.licensePlate;
        state.isVehicleRegistered = true;
      }
    },
    unregisterVehicle: (state, action: PayloadAction<string>) => {
      const vehicleId = action.payload;
      state.registeredVehicles = state.registeredVehicles.filter(v => v.vehicleId !== vehicleId);
      
      if (state.currentVehicle?.vehicleId === vehicleId) {
        state.currentVehicle = null;
        state.licensePlate = '';
        state.isVehicleRegistered = false;
      }
    },
    clearCurrentVehicle: (state) => {
      state.currentVehicle = null;
      state.licensePlate = '';
      state.isVehicleRegistered = false;
    },
  },
});

export const {
  setLicensePlate,
  registerVehicle,
  selectVehicle,
  unregisterVehicle,
  clearCurrentVehicle,
} = vehicleSlice.actions;

export default vehicleSlice.reducer;
