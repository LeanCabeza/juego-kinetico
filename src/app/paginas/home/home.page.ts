import { Component, OnDestroy } from '@angular/core';
import { DeviceMotion, DeviceMotionAccelerationData } from '@awesome-cordova-plugins/device-motion/ngx';
import { NavController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnDestroy {


  imagenesPodio = [
    '/assets/images/numero-1.png',
    '/assets/images/numero-2.png',
    '/assets/images/numero-3.png',
    '/assets/images/numero-4.png',
    '/assets/images/numero-5.png'
  ];
  accelerationX: number | null = 0;
  accelerationY: number | null = 0;
  radius: number = 50; // Radio del círculo
  centerX: number = 0; // Posición X del centro del círculo
  centerY: number = 0; // Posición Y del centro del círculo
  timeElapsed: number = 0; // Tiempo transcurrido sin perder en segundos
  timer: any; // Referencia al temporizador
  game: boolean = false;
  selectedBrand = "";
  selectedCharacter = "";
  subscription: any;
  mostrarPodio: boolean = false;
  puntajesMasBajos: any[] = [];


  constructor(
    private deviceMotion: DeviceMotion,
    public navCtrl: NavController,
    public firebaseService:FirebaseService
  ) {}

  ngOnInit() {
    this.obtenerPuntajes();
  }

  async obtenerPuntajes() {
    try {
      (await this.firebaseService.obtenerPuntajes()).subscribe(puntajes => {
        this.puntajesMasBajos = puntajes;
      });
    } catch (error) {
      console.error('Error al obtener puntajes:', error);
    }
  }

  volver(){
    this.selectedCharacter = '';
    this.selectedBrand = "";
    this.mostrarPodio= false;
    this.game = false;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getCircleBackgroundImage(personaje: string): string {
      switch (personaje) {
        case 'spiderman':
          return '/assets/images/spiderman_player.png';
        case 'hulk':
          return '/assets/images/hulk_player.png';
        case 'ironman':
          return '/assets/images/ironman_player.png';
        case 'rocket':
          return '/assets/images/rocket_player.png';
        case 'superman':
          return '/assets/images/superman_player.png';
        case 'batman':
          return '/assets/images/batman_player.png';
        case 'flash':
          return '/assets/images/flash_player.png';
        case 'linterna-verde':
          return '/assets/images/linterna_player.png';
        default:
          return ''; // Puedes establecer una imagen predeterminada aquí
      }
    }
  

  startGame() {
    // Inicializar el círculo en el centro de la pantalla
    this.game = true;
    this.timeElapsed = 0; // Restablece el tiempo transcurrido
    this.startTimer(); // Inicia el temporizador
    this.centerX = window.innerWidth / 2;
    this.centerY = window.innerHeight / 2;

    this.subscription = this.deviceMotion.watchAcceleration({ frequency: 50 }).subscribe(
      (acceleration: DeviceMotionAccelerationData) => {
        // Actualizar la posición del círculo en función de la aceleración
        this.accelerationX = Math.floor(acceleration.x);
        this.accelerationY = Math.floor(acceleration.y);
        
        // Multiplicar la aceleración por un valor mayor para moverse más rápido
        this.centerX += this.accelerationX * 4;
        this.centerY += this.accelerationY * 4;  

        // Verificar si el personaje ha llegado a los márgenes de la pantalla
        if (
          this.centerX - this.radius < 0 ||                      // Márgen izquierdo
          this.centerX + this.radius > window.innerWidth ||     // Márgen derecho
          this.centerY - this.radius < 0 ||                      // Márgen superior
          this.centerY + this.radius > window.innerHeight         // Márgen inferior
        ) {
          this.gameOver();
          return;
        }

        // Limitar la posición del círculo dentro de la pantalla
        this.centerX = Math.max(this.radius, Math.min(window.innerWidth - this.radius, this.centerX));
        this.centerY = Math.max(this.radius, Math.min(window.innerHeight - this.radius, this.centerY));
      }
    );
  }

  selectCharacter(personaje: string){
      this.selectedCharacter = personaje;
      this.selectedBrand = "";
      console.log("El personaje seleccionado fue: ", personaje)
      this.startGame();
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeElapsed++;
    }, 1000); // Incrementa el tiempo en segundos cada segundo
  }

  gameOver() {
    clearInterval(this.timer); // Detiene el temporizador
    this.game = false;
    this.subscription.unsubscribe();
    this.firebaseService.guardarRegistro(this.timeElapsed);

    Swal.fire({
      title: 'Perdiste 😂',
      text: `Tocaste los márgenes de la pantalla. Tiempo sin perder: ${this.timeElapsed} segundos`,
      icon: 'success',
      heightAuto: false,
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Jugar Nuevamente',
    }).then((result) => {
      if (result.isConfirmed) {
        this.startGame();
      }else{
        this.volver();
      }
    });


  }
}