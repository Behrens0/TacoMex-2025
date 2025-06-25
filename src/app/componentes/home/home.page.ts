import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/servicios/supabase.service';
import { AuthService } from 'src/app/servicios/auth.service';
import { LoadingService } from 'src/app/servicios/loading.service';
// import { PushNotificationService } from 'src/app/servicios/push-notification.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon, AlertController, ModalController, IonModal } from '@ionic/angular/standalone';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonButton,
    FormsModule,
    RouterModule,
    CommonModule,
    IonContent,
    IonIcon,
    IonModal
  ],
})
export class HomePage implements OnInit, OnDestroy {
  mostrarBotonRegistro: boolean = false;
  isSupported = false;
  perfilUsuario: string = '';
  esBartender: boolean = false;
  esCocinero: boolean = false;
  usuario: any = null;
  mesaAsignada: any = null;
  mostrarBotonEscanearMesa: boolean = false;
  mensajeErrorQR: string = '';
  private realtimeChannel: RealtimeChannel | null = null;
  mostrarModalProductos: boolean = false;
  productosPorTipo: { [key: string]: any[]; comida: any[]; bebida: any[]; postre: any[] } = { comida: [], bebida: [], postre: [] };
  seleccionProductos: { [id: string]: { producto: any, cantidad: number } } = {};
  private intervaloMesa: any;
  mesaAsignadaAnterior: any = null;
  mostrarModalConsultaMozo: boolean = false;
  consultaMozo: string = '';
  mostrarErrorConsultaMozo: boolean = false;
  animandoSalidaModalConsultaMozo: boolean = false;
  mostrarModalConsultasMozo: boolean = false;
  consultasMozo: any[] = [];
  cargandoConsultasMozo: boolean = false;
  respuestaMozoPorId: { [id: string]: string } = {};
  errorRespuestaMozoPorId: { [id: string]: string } = {};
  mostrarRespuestaId: number | null = null;
  mostrarModalConsultasCliente: boolean = false;
  consultasCliente: any[] = [];
  cargandoConsultasCliente: boolean = false;
  consultaClienteTexto: string = '';
  errorConsultaCliente: string = '';
  intervaloConsultasMozo: any = null;
  clienteSentado: boolean = false;
  mostrarBotonHacerPedido: boolean = false;
  mostrarConfirmacionPedido: boolean = false;
  cargandoConfirmacion: boolean = false;
  productosSeleccionadosParaConfirmar: { producto: any, cantidad: number }[] = [];
  clickeandoResumen: boolean = false;
  yaEnListaEspera: boolean = false;
  qrEnProceso: boolean = false;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private loadingService: LoadingService,
    private alertController: AlertController,
    private modalController: ModalController
    // private pushNotificationService: PushNotificationService
  ) {}

  ngOnInit() {
    this.mostrarBotonRegistro = this.authService.puedeAccederARegistro() && this.router.url !== '/registro';
    this.perfilUsuario = this.authService.getPerfilUsuario();
    this.esBartender = this.authService.esUsuarioBartender();
    this.esCocinero = this.authService.esUsuarioCocinero();

    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });

    this.iniciarActualizacionMesa();
  }

  irARegistro() {
    this.loadingService.show();
    this.router.navigate(['/registro']);
    this.loadingService.hide();
  }

  irAListaEspera() {
    this.loadingService.show();
    this.router.navigate(['/lista-espera']);
    this.loadingService.hide();
  }

  irAEncuesta() {
    this.loadingService.show();
    this.router.navigate(['/encuestas']);
    this.loadingService.hide();
  }

  ionViewWillEnter() {
    this.cargarUsuario();
  }

  async cargarUsuario() {
    try {
      const { data, error } = await this.authService.getCurrentUser();
      
      if (error) {
        return;
      }
      
      this.usuario = data?.user;

      if (!this.usuario) {
        this.router.navigateByUrl('/login');
      } else {
        if (this.perfilUsuario === 'cliente') {
          await this.verificarMesaAsignada();
        }
        
        // const correo = this.user.email;
        // if (correo) {
        //   const { data: empleado } = await this.supabase.supabase
        //     .from('empleados')
        //     .select('id')
        //     .eq('correo', correo)
        //     .single();
        //   if (empleado) {
        //     this.router.navigate(['/encuestas']);
        //     return;
        //   }
        // }
        // this.perfilUsuario = this.authService.getPerfilUsuario();
        // this.esBartender = this.authService.esUsuarioBartender();
        // this.esCocinero = this.authService.esUsuarioCocinero();
        // this.mostrarBotonRegistro = this.authService.puedeAccederARegistro() && this.router.url !== '/registro';
        
        // Inicializar notificaciones push si el usuario ya está logueado
        // TEMPORALMENTE DESHABILITADO
        /*
        try {
          await this.pushNotificationService.initializePushNotifications();
        } catch (error) {
          console.error('Error al inicializar notificaciones push:', error);
          // No bloquear la app si fallan las notificaciones
        }
        */
      }
    } catch (error) {
      this.router.navigateByUrl('/login');
    }
  }

  async verificarMesaAsignada() {
    try {
      const { data: lista, error: errorLista } = await this.supabase.supabase
        .from('lista_espera')
        .select('*')
        .eq('correo', this.usuario.email);
      this.yaEnListaEspera = Array.isArray(lista) && lista.length > 0;

      const { data: clienteEnLista, error } = await this.supabase.supabase
        .from('lista_espera')
        .select('mesa_asignada')
        .eq('correo', this.usuario.email)
        .not('mesa_asignada', 'is', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        return;
      }

      const nuevaMesaAsignada = clienteEnLista?.mesa_asignada || null;

      if (nuevaMesaAsignada !== this.mesaAsignadaAnterior) {
        this.loadingService.show();
        setTimeout(() => {
          this.loadingService.hide();
        }, 1000);
      }

      this.mesaAsignada = nuevaMesaAsignada;
      this.mostrarBotonEscanearMesa = !!nuevaMesaAsignada;
      this.mesaAsignadaAnterior = nuevaMesaAsignada;

      if (nuevaMesaAsignada) {
        await this.verificarClienteSentado();
      } else {
        this.clienteSentado = false;
        this.mostrarBotonHacerPedido = false;
      }
    } catch (error) {
      return;
    }
  }

  async verificarClienteSentado() {
    try {
      const { data: clienteEnLista, error } = await this.supabase.supabase
        .from('clientes')
        .select('sentado')
        .eq('correo', this.usuario.email)
        .single();

      if (error && error.code !== 'PGRST116') {
        return;
      }

      const sentado = clienteEnLista?.sentado || false;

      this.clienteSentado = sentado;
      this.mostrarBotonHacerPedido = sentado;
    } catch (error) {
      return;
    }
  }

  async cerrarSesion() {
    this.loadingService.show();
    await this.authService.signOut();
    this.router.navigateByUrl('/login', { replaceUrl: true });
    this.loadingService.hide();
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  async escanearQR() {
    this.qrEnProceso = true;
    this.loadingService.show();
    try {
      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        const codigoEscaneado = barcodes[0].displayValue;
        await this.procesarCodigoEscaneado(codigoEscaneado);
      } else {
        await this.mostrarAlerta('Error', 'No se detectó ningún código QR.');
      }
    } catch (error) {
      await this.mostrarAlerta('Error', 'Error al escanear el código QR.');
    } finally {
      this.loadingService.hide();
      this.qrEnProceso = false;
    }
  }

  async procesarCodigoEscaneado(codigo: string) {
    const codigoEsperado = 'b71c9d3a4e1f5a62c3340b87df0e8a129cab6e3d';
    
    if (codigo === codigoEsperado) {
      await this.agregarAListaEspera();
    } else {
      await this.mostrarAlerta('Código inválido', 'El código QR escaneado no es válido para la lista de espera.');
    }
  }

  async agregarAListaEspera() {
    try {
      if (!this.usuario) {
        await this.mostrarAlerta('Error', 'No se pudo obtener la información del usuario.');
        return;
      }

      const { data: clienteEnLista } = await this.supabase.supabase
        .from('lista_espera')
        .select('*')
        .eq('correo', this.usuario.email)
        .single();

      if (clienteEnLista) {
        await this.mostrarAlerta('Ya en Lista', 'Ya estás en la lista de espera.');
        return;
      }

      const { data: cliente, error: errorCliente } = await this.supabase.supabase
        .from('clientes')
        .select('nombre, apellido, correo')
        .eq('correo', this.usuario.email)
        .single();

      if (errorCliente || !cliente) {
        await this.mostrarAlerta('Error', 'No se pudo obtener la información del cliente.');
        return;
      }

      const ahora = new Date();
      const fechaFormateada = ahora.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });

      const [fecha, hora] = fechaFormateada.replace(',', '').split(' ');
      const [dia, mes, anio] = fecha.split('/');
      const fechaFinal = `${anio}-${mes}-${dia} ${hora}:00`;

      const { error: errorInsert } = await this.supabase.supabase
        .from('lista_espera')
        .insert([{
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          correo: cliente.correo,
          fecha_ingreso: fechaFinal
        }]);

      if (errorInsert) {
        await this.mostrarAlerta('Error', 'No se pudo agregar a la lista de espera: ' + errorInsert.message);
        return;
      }

      await this.mostrarAlerta('Éxito', 'Has sido agregado exitosamente a la lista de espera.');
      
    } catch (error) {
      await this.mostrarAlerta('Error', 'Error inesperado al agregar a la lista de espera.');
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  async escanearMesaAsignada() {
    this.loadingService.show();
    
    try {
      const { barcodes } = await BarcodeScanner.scan();
      
      if (barcodes.length > 0) {
        const codigoEscaneado = barcodes[0].displayValue;
        await this.validarMesaEscaneada(codigoEscaneado);
      } else {
        this.mostrarMensajeError('QR inválido, escanea el QR de tu mesa');
      }
    } catch (error) {
      this.mostrarMensajeError('QR inválido, escanea el QR de tu mesa');
    } finally {
      this.loadingService.hide();
    }
  }

  async validarMesaEscaneada(codigoEscaneado: string) {
    let qrValido = false;
    try {
      const datosQR = JSON.parse(codigoEscaneado);
      if (datosQR.numeroMesa === parseInt(this.mesaAsignada)) {
        qrValido = true;
      }
    } catch (e) {
      const patronEsperado = `numeroMesa: ${this.mesaAsignada}`;
      if (codigoEscaneado.includes(patronEsperado)) {
        qrValido = true;
      }
    }
    if (!qrValido) {
      this.mostrarMensajeError('QR inválido, escanea el QR de tu mesa');
    } else {
      await this.marcarClienteSentado();
    }
  }

  mostrarMensajeError(mensaje: string) {
    this.mensajeErrorQR = mensaje;
    setTimeout(() => {
      this.mensajeErrorQR = '';
    }, 5000);
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.detenerActualizacionMesa();
  }

  iniciarActualizacionMesa() {
    this.detenerActualizacionMesa();
    this.intervaloMesa = setInterval(() => {
      this.verificarMesaAsignada();
    }, 5000);
  }

  detenerActualizacionMesa() {
    if (this.intervaloMesa) {
      clearInterval(this.intervaloMesa);
      this.intervaloMesa = null;
    }
  }

  async abrirModalProductosMesa() {
    this.loadingService.show();
    try {
      const { data: productos, error } = await this.supabase.supabase
        .from('productos')
        .select('*');
      if (error) {
        await this.mostrarAlerta('Error', 'No se pudieron cargar los productos.');
        return;
      }
      this.productosPorTipo = { comida: [], bebida: [], postre: [] };
      for (const prod of productos) {
        if (prod.tipo === 'comida') this.productosPorTipo.comida.push(prod);
        else if (prod.tipo === 'bebida') this.productosPorTipo.bebida.push(prod);
        else if (prod.tipo === 'postre') this.productosPorTipo.postre.push(prod);
      }
      this.mostrarModalProductos = true;
    } finally {
      this.loadingService.hide();
    }
  }

  cerrarModalProductosMesa() {
    this.mostrarModalProductos = false;
  }

  sumarProducto(producto: any) {
    if (!this.seleccionProductos[producto.id]) {
      this.seleccionProductos[producto.id] = { producto, cantidad: 1 };
    } else {
      this.seleccionProductos[producto.id].cantidad++;
    }
  }

  restarProducto(producto: any) {
    if (this.seleccionProductos[producto.id]) {
      this.seleccionProductos[producto.id].cantidad--;
      if (this.seleccionProductos[producto.id].cantidad <= 0) {
        delete this.seleccionProductos[producto.id];
      }
    }
  }

  getCantidadSeleccionada(producto: any): number {
    return this.seleccionProductos[producto.id]?.cantidad || 0;
  }

  getTotalPrecio(): number {
    return Object.values(this.seleccionProductos).reduce((acc, sel) => acc + sel.producto.precio * sel.cantidad, 0);
  }

  getTotalTiempo(): number {
    const maxPorTipo: { [tipo: string]: number } = { comida: 0, bebida: 0, postre: 0 };
    Object.values(this.seleccionProductos).forEach(sel => {
      const tipo = sel.producto.tipo;
      const tiempo = Number(sel.producto.tiempo_elaboracion);
      if (maxPorTipo[tipo] !== undefined && tiempo > maxPorTipo[tipo]) {
        maxPorTipo[tipo] = tiempo;
      }
    });
    return maxPorTipo['comida'] + maxPorTipo['bebida'] + maxPorTipo['postre'];
  }

  abrirConsultaMozo() {
    this.mostrarModalConsultaMozo = true;
    this.consultaMozo = '';
    this.mostrarErrorConsultaMozo = false;
  }

  cerrarConsultaMozo(animar: boolean = false) {
    if (animar) {
      this.animandoSalidaModalConsultaMozo = true;
      setTimeout(() => {
        this.mostrarModalConsultaMozo = false;
        this.animandoSalidaModalConsultaMozo = false;
        this.consultaMozo = '';
        this.mostrarErrorConsultaMozo = false;
      }, 250);
    } else {
      this.mostrarModalConsultaMozo = false;
      this.animandoSalidaModalConsultaMozo = false;
      this.consultaMozo = '';
      this.mostrarErrorConsultaMozo = false;
    }
  }

  async confirmarConsultaMozo() {
    if (!this.consultaMozo.trim() || this.consultaMozo.trim().length < 10) {
      this.mostrarErrorConsultaMozo = true;
      return;
    }
    this.mostrarErrorConsultaMozo = false;
    try {
      const ahora = new Date();
      const fechaFormateada = ahora.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });
      const [fecha, hora] = fechaFormateada.replace(',', '').split(' ');
      const [dia, mes, anio] = fecha.split('/');
      const horaFinal = `${anio}-${mes}-${dia} ${hora}`;
      const mesa = this.mesaAsignada ? String(this.mesaAsignada) : '';
      const { error } = await this.supabase.supabase
        .from('consultas_a_mozo')
        .insert([
          {
            consulta: this.consultaMozo.trim(),
            hora: horaFinal,
            mesa: mesa
          }
        ]);
      if (error) {
        this.mostrarAlerta('Error', 'No se pudo enviar la consulta.');
      } else {
        this.mostrarAlerta('Enviado', 'Su consulta fue enviada al mozo.');
        this.cerrarConsultaMozo(true);
      }
    } catch (e) {
      this.mostrarAlerta('Error', 'No se pudo enviar la consulta.');
    }
  }

  abrirModalConsultasMozo() {
    this.mostrarModalConsultasMozo = true;
    this.cargarConsultasMozo();
    if (this.intervaloConsultasMozo) {
      clearInterval(this.intervaloConsultasMozo);
    }
    this.intervaloConsultasMozo = setInterval(() => this.cargarConsultasMozo(true), 5000);
  }

  cerrarModalConsultasMozo() {
    this.mostrarModalConsultasMozo = false;
    this.respuestaMozoPorId = {};
    this.errorRespuestaMozoPorId = {};
    if (this.intervaloConsultasMozo) {
      clearInterval(this.intervaloConsultasMozo);
      this.intervaloConsultasMozo = null;
    }
  }

  async cargarConsultasMozo(polling: boolean = false) {
    let mostrarLoading = !polling;
    let prevIds = this.consultasMozo?.map(c => c.id).join(',') || '';
    const { data, error } = await this.supabase.supabase
      .from('consultas_a_mozo')
      .select('*')
      .order('hora', { ascending: false });
    if (!error) {
      const newIds = data?.map((c: any) => c.id).join(',') || '';
      if (polling && (newIds !== prevIds || data.length !== this.consultasMozo.length)) {
        mostrarLoading = true;
      }
      if (mostrarLoading) this.cargandoConsultasMozo = true;
      this.consultasMozo = data;
      if (mostrarLoading) setTimeout(() => { this.cargandoConsultasMozo = false; }, 600);
    }
    if (!mostrarLoading) this.cargandoConsultasMozo = false;
  }

  async enviarRespuestaMozo(consulta: any) {
    const id = consulta.id;
    const respuesta = this.respuestaMozoPorId[id]?.trim() || '';
    if (!respuesta) {
      this.errorRespuestaMozoPorId[id] = 'Debe ingresar una respuesta.';
      return;
    }
    this.errorRespuestaMozoPorId[id] = '';
    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });
    const [fecha, hora] = fechaFormateada.replace(',', '').split(' ');
    const [dia, mes, anio] = fecha.split('/');
    const horaFinal = `${anio}-${mes}-${dia} ${hora}`;
    const usuario = this.usuario;
    let nombreMozo = '';
    if (usuario && usuario.email) {
      const { data: mozo } = await this.supabase.supabase
        .from('empleados')
        .select('nombre,apellido')
        .eq('correo', usuario.email)
        .single();
      if (mozo) {
        nombreMozo = mozo.nombre + ' ' + mozo.apellido;
      }
    }
    const { error } = await this.supabase.supabase
      .from('consultas_a_mozo')
      .update({
        respuesta: respuesta,
        hora_respuesta: horaFinal,
        mozo: nombreMozo
      })
      .eq('id', id);
    if (!error) {
      this.cargarConsultasMozo();
      this.respuestaMozoPorId[id] = '';
      this.errorRespuestaMozoPorId[id] = '';
      this.mostrarRespuestaId = null;
    } else {
      this.errorRespuestaMozoPorId[id] = 'Error al enviar la respuesta.';
    }
  }

  formatearHoraConsulta(fecha: string): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      const dia = d.getDate().toString().padStart(2, '0');
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const hora = d.getHours().toString().padStart(2, '0');
      const minuto = d.getMinutes().toString().padStart(2, '0');
      return `${dia}/${mes} ${hora}:${minuto}`;
    } catch {
      return fecha;
    }
  }

  abrirModalConsultasCliente() {
    this.mostrarModalConsultasCliente = true;
    this.cargarConsultasCliente();
    this.consultaClienteTexto = '';
    this.errorConsultaCliente = '';
  }

  cerrarModalConsultasCliente() {
    this.mostrarModalConsultasCliente = false;
    this.consultaClienteTexto = '';
    this.errorConsultaCliente = '';
  }

  async cargarConsultasCliente() {
    this.cargandoConsultasCliente = true;
    const correo = this.usuario?.email;
    let consultas: any[] = [];
    if (correo) {
      const { data, error } = await this.supabase.supabase
        .from('consultas_a_mozo')
        .select('*')
        .eq('correo', correo)
        .order('hora', { ascending: false });
      if (!error) {
        consultas = data;
      }
    }
    this.consultasCliente = consultas;
    this.cargandoConsultasCliente = false;
  }

  async enviarConsultaCliente() {
    if (!this.consultaClienteTexto.trim() || this.consultaClienteTexto.trim().length < 10) {
      this.errorConsultaCliente = 'La consulta debe tener al menos 10 caracteres.';
      return;
    }
    this.errorConsultaCliente = '';
    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });
    const [fecha, hora] = fechaFormateada.replace(',', '').split(' ');
    const [dia, mes, anio] = fecha.split('/');
    const horaFinal = `${anio}-${mes}-${dia} ${hora}`;
    const mesa = this.mesaAsignada ? String(this.mesaAsignada) : '';
    const correo = this.usuario?.email || '';
    const { error } = await this.supabase.supabase
      .from('consultas_a_mozo')
      .insert([
        {
          consulta: this.consultaClienteTexto.trim(),
          hora: horaFinal,
          mesa: mesa,
          correo: correo
        }
      ]);
    if (error) {
      this.errorConsultaCliente = 'No se pudo enviar la consulta.';
    } else {
      this.consultaClienteTexto = '';
      this.cargarConsultasCliente();
    }
  }

  async marcarClienteSentado() {
    try {
      const { error } = await this.supabase.supabase
        .from('clientes')
        .update({
          sentado: true
        })
        .eq('correo', this.usuario.email);

      if (error) {
        this.mostrarAlerta('Error', 'No se pudo marcar el cliente como sentado.');
      } else {
        this.mostrarAlerta('¡Bienvenido!', 'Has sido marcado como sentado en tu mesa. Ya puedes hacer tu pedido.');
        this.clienteSentado = true;
        this.mostrarBotonHacerPedido = true;
      }
    } catch (error) {
      this.mostrarAlerta('Error', 'Error al marcar el cliente como sentado.');
    }
  }

  irAHacerPedido() {
    this.abrirModalProductosMesa();
  }

  abrirConfirmacionPedido() {
    this.cargandoConfirmacion = true;
    this.mostrarConfirmacionPedido = true;
    this.productosSeleccionadosParaConfirmar = Object.values(this.seleccionProductos).map(sel => ({ producto: sel.producto, cantidad: sel.cantidad }));
    setTimeout(() => {
      this.cargandoConfirmacion = false;
    }, 800);
  }

  async confirmarPedido() {
    this.cargandoConfirmacion = true;
    const comidas: string[] = [];
    const bebidas: string[] = [];
    const postres: string[] = [];
    this.productosSeleccionadosParaConfirmar.forEach(item => {
      for (let i = 0; i < item.cantidad; i++) {
        if (item.producto.tipo === 'comida') comidas.push(item.producto.nombre);
        if (item.producto.tipo === 'bebida') bebidas.push(item.producto.nombre);
        if (item.producto.tipo === 'postre') postres.push(item.producto.nombre);
      }
    });
    const precio = this.getTotalPrecio();
    const tiempo_estimado = this.getTotalTiempo();
    try {
      this.loadingService.show();
      const { error } = await this.supabase.supabase
        .from('pedidos')
        .insert([
          {
            mesa: this.mesaAsignada,
            comidas,
            bebidas,
            postres,
            precio,
            tiempo_estimado
          }
        ]);
      if (!error) {
        this.mostrarConfirmacionPedido = false;
        this.seleccionProductos = {};
        this.mostrarModalProductos = false;
        this.productosSeleccionadosParaConfirmar = [];
        this.mostrarAlerta('¡Pedido realizado!', 'Tu pedido fue enviado correctamente.');
      } else {
        this.mostrarAlerta('Error', 'No se pudo enviar el pedido.');
      }
    } catch (e) {
      this.mostrarAlerta('Error', 'No se pudo enviar el pedido.');
    } finally {
      this.cargandoConfirmacion = false;
      this.loadingService.hide();
    }
  }

  cancelarConfirmacionPedido() {
    this.mostrarConfirmacionPedido = false;
    this.clickeandoResumen = false;
  }
}
