 export interface Room {
   id: string;
   is_vacant: boolean;
   label: string;
   is_inactive: boolean;
   error?: boolean;
 }
 
 export interface RoomLabel {
   name: string;
   id: string;
   total: number;
   status: string;
   activity?: string;
   empty: boolean;
   occupied: boolean;
   occupancy?: number;
   activity_count?: number;
   showRed?: boolean;
 }
 
 export interface BeautyDate {
   time: string;
   day: string;
 }
 
 export interface Platform {
   os: string;
   is_touch: boolean;
 }
 
 export interface Summary {
   empty: boolean;
   occupied: boolean;
   status: string;
   activity?: string;
   activity_count?: number;
   occupancy?: number;
 }