import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/servicios/supabase.service';
import { AuthService } from 'src/app/servicios/auth.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PushNotificationService } from 'src/app/servicios/push-notification.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon, AlertController, ModalController, IonModal, IonSpinner } from '@ionic/angular/standalone';
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
    IonModal,
    IonSpinner
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
  mostrarModalPedidos: boolean = false;
  pedidos: any[] = [];
  cargandoPedidos: boolean = false;
  mostrarBotonVerEstadoPedido: boolean = false;
  pedidoActualCliente: any = null;
  mostrarModalEstadoPedido: boolean = false;
  mostrarModalPedidosPreparar: boolean = false;
  pedidosPreparar: any[] = [];
  cargandoPedidosPreparar: boolean = false;
  clienteInfo: any = null;
  mostrarModalPago: boolean = false;
  propinaSeleccionada: number = 0;
  mostrarModalClientesPendientes: boolean = false;
  clientesPendientes: any[] = [];
  cargandoClientesPendientes: boolean = false;

  constructor(
    public authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private loadingService: LoadingService,
    private pushNotificationService: PushNotificationService,
    private alertController: AlertController,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.mostrarBotonRegistro = this.authService.puedeAccederARegistro() && this.router.url !== '/registro';
    this.perfilUsuario = this.authService.getPerfilUsuario();
    this.esBartender = this.authService.esUsuarioBartender();
    this.esCocinero = this.authService.esUsuarioCocinero();
    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
    this.iniciarActualizacionMesa();
    await this.verificarPedidoExistente();
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

  verEncuestasPrevias() {
    this.loadingService.show();
    this.router.navigate(['/encuestas'], { queryParams: { modo: 'ver' } });
    this.loadingService.hide();
  }

  hacerEncuesta() {
    this.loadingService.show();
    this.router.navigate(['/encuestas'], { queryParams: { modo: 'hacer' } });
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
          await this.cargarClienteInfo();
        }
      }
    } catch (error) {
      this.router.navigateByUrl('/login');
    }
  }

  async cargarClienteInfo() {
    if (!this.usuario || this.perfilUsuario !== 'cliente') return;
    
    try {
      const { data, error } = await this.supabase.supabase
        .from('clientes')
        .select('*')
        .eq('correo', this.usuario.email)
        .single();
      
      if (!error && data) {
        this.clienteInfo = data;
      }
    } catch (error) {
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
        await this.verificarPedidoExistente();
      } else {
        this.clienteSentado = false;
        this.mostrarBotonHacerPedido = false;
        this.mostrarBotonVerEstadoPedido = false;
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

      try {
        await this.pushNotificationService.notificarMaitreNuevoCliente(
          cliente.nombre,
          cliente.apellido
        );
      } catch (error) {
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
      try {
        const clienteNombre = this.clienteInfo?.nombre || this.usuario?.email?.split('@')[0] || 'Cliente';
        const clienteApellido = this.clienteInfo?.apellido || '';
        
        await this.pushNotificationService.notificarMozosConsultaCliente(
          clienteNombre,
          clienteApellido,
          mesa,
          this.consultaClienteTexto.trim()
        );
      } catch (error) {
      }
      
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
        this.mostrarBotonHacerPedido = false;
        await this.verificarPedidoExistente();
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
        await this.verificarPedidoExistente();
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

  async escanearQRProducto() {
    this.loadingService.show();
    try {
      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        let datosQR;
        try {
          datosQR = JSON.parse(barcodes[0].displayValue);
        } catch (e) {
          await this.mostrarAlerta('Error', 'El QR escaneado no es válido.');
          return;
        }
        const nombre = datosQR?.nombreProducto || datosQR?.nombre;
        if (!nombre) {
          await this.mostrarAlerta('Error', 'El QR no contiene el nombre del producto.');
          return;
        }
        let productoEncontrado = null;
        for (const tipo of ['comida', 'bebida', 'postre']) {
          productoEncontrado = this.productosPorTipo[tipo].find(p => p.nombre === nombre);
          if (productoEncontrado) break;
        }
        if (productoEncontrado) {
          this.sumarProducto(productoEncontrado);
        } else {
          await this.mostrarAlerta('Error', 'No se encontró el producto en el menú.');
        }
      } else {
        await this.mostrarAlerta('Error', 'No se detectó ningún código QR.');
      }
    } catch (error) {
      await this.mostrarAlerta('Error', 'Error al escanear el QR del producto.');
    } finally {
      this.loadingService.hide();
    }
  }

  abrirModalPedidos() {
    this.mostrarModalPedidos = true;
    this.cargarPedidos();
  }

  cerrarModalPedidos() {
    this.mostrarModalPedidos = false;
    this.pedidos = [];
  }

  async cargarPedidos() {
    this.cargandoPedidos = true;
    try {
      const { data, error } = await this.supabase.supabase
        .from('pedidos')
        .select('*')
        .order('id', { ascending: false });
      if (!error) {
        this.pedidos = data;
      }
    } finally {
      this.cargandoPedidos = false;
    }
  }

  async marcarPedidoEntregado(pedido: any) {
    const { error } = await this.supabase.supabase
      .from('pedidos')
      .update({ estado: 'Entregado' })
      .eq('id', pedido.id);
    
    if (!error) {
      pedido.estado = 'Entregado';
      await this.cargarPedidos();
    }
  }

  async llevarCuenta(pedido: any) {
    const { error } = await this.supabase.supabase
      .from('pedidos')
      .update({ cuenta: 'entregada' })
      .eq('id', pedido.id);
    
    if (!error) {
      pedido.cuenta = 'entregada';
      await this.cargarPedidos();
    }
  }

  async confirmarRecepcion() {
    if (!this.pedidoActualCliente) return;
    
    const { error } = await this.supabase.supabase
      .from('pedidos')
      .update({ recepcion: true })
      .eq('id', this.pedidoActualCliente.id);
    
    if (!error) {
      this.pedidoActualCliente.recepcion = true;
      await this.verificarPedidoExistente();
    }
  }

  async pedirCuenta() {
    if (!this.pedidoActualCliente) return;
    
    const { error } = await this.supabase.supabase
      .from('pedidos')
      .update({ cuenta: 'pedida' })
      .eq('id', this.pedidoActualCliente.id);
    
    if (!error) {
      this.pedidoActualCliente.cuenta = 'pedida';

      try {
        const clienteNombre = this.clienteInfo?.nombre || this.usuario?.email?.split('@')[0] || 'Cliente';
        const clienteApellido = this.clienteInfo?.apellido || '';
        
        await this.pushNotificationService.notificarMozoSolicitudCuenta(
          this.mesaAsignada,
          clienteNombre,
          clienteApellido
        );
      } catch (error) {
      }
      
      await this.verificarPedidoExistente();
    }
  }

  async abrirModalPago() {
    if (this.productosPorTipo.comida.length === 0 && 
        this.productosPorTipo.bebida.length === 0 && 
        this.productosPorTipo.postre.length === 0) {
      const { data: productos, error } = await this.supabase.supabase
        .from('productos')
        .select('*');
      if (!error && productos) {
        this.productosPorTipo = { comida: [], bebida: [], postre: [] };
        for (const prod of productos) {
          if (prod.tipo === 'comida') this.productosPorTipo.comida.push(prod);
          else if (prod.tipo === 'bebida') this.productosPorTipo.bebida.push(prod);
          else if (prod.tipo === 'postre') this.productosPorTipo.postre.push(prod);
        }
      }
    }
    this.propinaSeleccionada = 0;
    this.mostrarModalPago = true;
  }

  cerrarModalPago() {
    this.mostrarModalPago = false;
    this.propinaSeleccionada = 0;
  }

  seleccionarPropina(porcentaje: number) {
    this.propinaSeleccionada = porcentaje;
  }

  calcularPropina(): number {
    if (!this.pedidoActualCliente || this.propinaSeleccionada === 0) return 0;
    return Math.round(this.pedidoActualCliente.precio * (this.propinaSeleccionada / 100));
  }

  calcularTotalConPropina(): number {
    if (!this.pedidoActualCliente) return 0;
    return this.pedidoActualCliente.precio + this.calcularPropina();
  }

  agruparItems(arr: string[]): {nombre: string, cantidad: number}[] {
    if (!arr) return [];
    const map = new Map<string, number>();
    for (const nombre of arr) {
      map.set(nombre, (map.get(nombre) || 0) + 1);
    }
    return Array.from(map.entries()).map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }

  esUltimoItem(item: {nombre: string, cantidad: number}, arr: {nombre: string, cantidad: number}[]): boolean {
    return arr[arr.length - 1] === item;
  }

  async verificarPedidoExistente() {
    if (!this.mesaAsignada || this.perfilUsuario !== 'cliente') {
      this.mostrarBotonVerEstadoPedido = false;
      this.pedidoActualCliente = null;
      return;
    }
    const { data, error } = await this.supabase.supabase
      .from('pedidos')
      .select('*')
      .eq('mesa', this.mesaAsignada)
      .order('id', { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) {
      this.mostrarBotonVerEstadoPedido = true;
      this.pedidoActualCliente = data[0];
      this.mostrarBotonHacerPedido = false;
    } else {
      this.mostrarBotonVerEstadoPedido = false;
      this.pedidoActualCliente = null;
      this.mostrarBotonHacerPedido = this.clienteSentado;
    }

    await this.cargarClienteInfo();
  }

  abrirModalEstadoPedido() {
    this.mostrarModalEstadoPedido = true;
  }

  cerrarModalEstadoPedido() {
    this.mostrarModalEstadoPedido = false;
  }

  abrirModalPedidosPreparar() {
    this.mostrarModalPedidosPreparar = true;
    this.cargarPedidosPreparar();
  }

  cerrarModalPedidosPreparar() {
    this.mostrarModalPedidosPreparar = false;
    this.pedidosPreparar = [];
  }

  async cargarPedidosPreparar() {
    this.cargandoPedidosPreparar = true;
    try {
      const { data, error } = await this.supabase.supabase
        .from('pedidos')
        .select('*')
        .eq('confirmado', true)
        .not('estado', 'eq', 'Entregado')
        .order('id', { ascending: false });
      
      if (!error && data) {
        if (this.esCocinero) {
          this.pedidosPreparar = data.filter(pedido => 
            (pedido.comidas && pedido.comidas.length > 0) || 
            (pedido.postres && pedido.postres.length > 0)
          );
        } else if (this.esBartender) {
          this.pedidosPreparar = data.filter(pedido => 
            pedido.bebidas && pedido.bebidas.length > 0
          );
        }
      }
    } finally {
      this.cargandoPedidosPreparar = false;
    }
  }

  async marcarProductoTerminado(pedido: any, tipo: 'comida' | 'bebida' | 'postre', index: number) {
    
    const estadoField = tipo === 'comida' ? 'estado_comida' : tipo === 'bebida' ? 'estado_bebida' : 'estado_postre';
    const productos = tipo === 'comida' ? pedido.comidas : tipo === 'bebida' ? pedido.bebidas : pedido.postres;
    
    let estados = pedido[estadoField] || [];
    if (estados.length < productos.length) {
      estados = new Array(productos.length).fill(false);
    }

    estados[index] = true;

    const todosTerminados = estados.every((estado: boolean) => estado === true);

    const updateData: any = { [estadoField]: estados };
  
    if (todosTerminados) {
      if (tipo === 'comida') {
        updateData.estado = 'Comidas listas';
      } else if (tipo === 'bebida') {
        updateData.estado = 'Bebidas listas';
      } else {
        updateData.estado = 'Postres listos';
      }

      try {
        await this.pushNotificationService.notificarMozoPedidoListo(
          pedido.mesa,
          tipo,
          productos,
          pedido.id
        );
      } catch (error) {
      }
    } else {
    }

    const { error } = await this.supabase.supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedido.id);
    
    if (error) {
    } else {
    }
    
    if (!error) {
      this.cargarPedidosPreparar();
    }
  }

  async marcarTipoCompletoTerminado(pedido: any, tipo: 'comida' | 'bebida' | 'postre') {
    
    try {
      const estadoField = tipo === 'comida' ? 'estado_comida' : tipo === 'bebida' ? 'estado_bebida' : 'estado_postre';
      const productos = tipo === 'comida' ? pedido.comidas : tipo === 'bebida' ? pedido.bebidas : pedido.postres;
      
      if (!productos || productos.length === 0) {
        return;
      }
      
      const updateData: any = {
        [estadoField]: true
      };
      
      const comidasCompletadas = pedido.comidas?.length > 0 ? (tipo === 'comida' ? true : pedido.estado_comida === true) : true;
      const bebidasCompletadas = pedido.bebidas?.length > 0 ? (tipo === 'bebida' ? true : pedido.estado_bebida === true) : true;
      const postresCompletados = pedido.postres?.length > 0 ? (tipo === 'postre' ? true : pedido.estado_postre === true) : true;

      if (comidasCompletadas && bebidasCompletadas && postresCompletados) {
        updateData.estado = 'Listo para entregar';
      }

      try {
        await this.pushNotificationService.notificarMozoPedidoListo(
          pedido.mesa,
          tipo,
          productos,
          pedido.id
        );
      } catch (error) {
      }
      
      const { error } = await this.supabase.supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedido.id);
      
      if (error) {
        return;
      }
      
      await this.cargarPedidosPreparar();
      
    } catch (error) {
    }
    
  }

  isTipoCompletoTerminado(pedido: any, tipo: 'comida' | 'bebida' | 'postre'): boolean {
    const estadoField = tipo === 'comida' ? 'estado_comida' : tipo === 'bebida' ? 'estado_bebida' : 'estado_postre';
    return pedido[estadoField] === true;
  }

  isProductoTerminado(pedido: any, tipo: 'comida' | 'bebida' | 'postre', index: number): boolean {
    const estadoField = tipo === 'comida' ? 'estado_comida' : tipo === 'bebida' ? 'estado_bebida' : 'estado_postre';
    return pedido[estadoField] === true;
  }

  getEstadoTipoProducto(pedido: any, tipo: 'comida' | 'bebida' | 'postre'): string {
    const estadoField = tipo === 'comida' ? 'estado_comida' : tipo === 'bebida' ? 'estado_bebida' : 'estado_postre';
    const productos = tipo === 'comida' ? pedido.comidas : tipo === 'bebida' ? pedido.bebidas : pedido.postres;
    
    if (!productos || productos.length === 0) {
      return 'Sin productos';
    }
    
    if (pedido[estadoField] === true) {
      return 'Listo';
    } else {
      return 'En preparación';
    }
  }

  agruparItemsConPrecio(arr: string[]): {nombre: string, cantidad: number, precio_unitario: number, precio_total: number}[] {
    if (!arr) return [];
    const map = new Map<string, {cantidad: number, precio_unitario: number}>();
    
    for (const nombre of arr) {
      if (map.has(nombre)) {
        map.get(nombre)!.cantidad++;
      } else {
        const producto = this.productosPorTipo.comida.find(p => p.nombre === nombre) ||
                        this.productosPorTipo.bebida.find(p => p.nombre === nombre) ||
                        this.productosPorTipo.postre.find(p => p.nombre === nombre);
        
        map.set(nombre, {
          cantidad: 1,
          precio_unitario: producto ? producto.precio : 0
        });
      }
    }
    
    return Array.from(map.entries()).map(([nombre, info]) => ({
      nombre,
      cantidad: info.cantidad,
      precio_unitario: info.precio_unitario,
      precio_total: info.precio_unitario * info.cantidad
    }));
  }

  async confirmarPago() {
    if (!this.pedidoActualCliente) return;
    
    const totalConPropina = this.calcularTotalConPropina();
    
    const { error } = await this.supabase.supabase
      .from('pedidos')
      .update({ 
        cuenta: 'chequeo',
        pagado: totalConPropina
      })
      .eq('id', this.pedidoActualCliente.id);
    
    if (!error) {
      this.pedidoActualCliente.cuenta = 'chequeo';
      this.pedidoActualCliente.pagado = totalConPropina;
      this.cerrarModalPago();

      const { error: errorDeletePedido } = await this.supabase.supabase
        .from('pedidos')
        .delete()
        .eq('id', this.pedidoActualCliente.id);

      if (errorDeletePedido) {
      }
            await this.verificarPedidoExistente();
    }
  }

  async confirmarPedidoMozo(pedido: any) {
    if (pedido.confirmado) return;
    
    const { error } = await this.supabase.supabase
      .from('pedidos')
      .update({ confirmado: true, estado: 'En preparación' })
      .eq('id', pedido.id);
    
    if (!error) {
      try {
        if (pedido.bebidas && pedido.bebidas.length > 0) {
          await this.pushNotificationService.notificarBartenderNuevoPedido(
            pedido.mesa,
            pedido.bebidas
          );
        }

        if ((pedido.comidas && pedido.comidas.length > 0) || (pedido.postres && pedido.postres.length > 0)) {
          await this.pushNotificationService.notificarCocineroNuevoPedido(
            pedido.mesa,
            pedido.comidas || [],
            pedido.postres || []
          );
        }
      } catch (error) {
      }
      
      this.cargarPedidos();
    }
  }

  async confirmarPagoMozo(pedido: any) {
    try {
      const { error: errorPedido } = await this.supabase.supabase
        .from('pedidos')
        .update({ cuenta: 'pagada' })
        .eq('id', pedido.id);
      
      if (errorPedido) {
        await this.mostrarAlerta('Error', 'No se pudo actualizar el pedido: ' + errorPedido.message);
        return;
      }

      const { data: listaEsperaData, error: errorListaEspera } = await this.supabase.supabase
        .from('lista_espera')
        .select('*')
        .eq('mesa_asignada', pedido.mesa);

      if (errorListaEspera) {
        await this.mostrarAlerta('Error', 'Error al buscar en lista de espera: ' + errorListaEspera.message);
        return;
      }

      if (listaEsperaData && listaEsperaData.length > 0) {
        const listaEspera = listaEsperaData[0];
        
        const { data: clienteData, error: errorCliente } = await this.supabase.supabase
          .from('clientes')
          .select('*')
          .eq('correo', listaEspera.correo);

        if (errorCliente) {
          await this.mostrarAlerta('Error', 'Error al buscar cliente: ' + errorCliente.message);
          return;
        }

        if (clienteData && clienteData.length > 0) {
          const cliente = clienteData[0];
          
          const { error: errorUpdateCliente } = await this.supabase.supabase
            .from('clientes')
            .update({ 
              sentado: false,
              encuesta: false
            })
            .eq('id', cliente.id);

          if (errorUpdateCliente) {
            await this.mostrarAlerta('Error', 'No se pudo actualizar el cliente: ' + errorUpdateCliente.message);
          }
        }

        const { error: errorDeleteListaEspera } = await this.supabase.supabase
          .from('lista_espera')
          .delete()
          .eq('correo', listaEspera.correo);

        if (errorDeleteListaEspera) {
          await this.mostrarAlerta('Error', 'No se pudo eliminar de lista de espera: ' + errorDeleteListaEspera.message);
        }
      }

      const { error: errorMesa } = await this.supabase.supabase
        .from('mesas')
        .update({ 
          ocupada: false
        })
        .eq('numero', pedido.mesa);

      if (errorMesa) {
        await this.mostrarAlerta('Error', 'No se pudo liberar la mesa: ' + errorMesa.message);
      }

      const { error: errorDeletePedido } = await this.supabase.supabase
        .from('pedidos')
        .delete()
        .eq('id', pedido.id);

      if (errorDeletePedido) {
        await this.mostrarAlerta('Error', 'No se pudo eliminar el pedido: ' + errorDeletePedido.message);
      }

      await this.cargarPedidos();
      
      await this.mostrarAlerta('Éxito', 'Pago confirmado, mesa liberada y pedido eliminado');
      
    } catch (error) {
      await this.mostrarAlerta('Error', 'Error inesperado al confirmar el pago: ' + error);
    }
  }

  async pagarCuenta() {
    this.abrirModalPago();
  }

  async abrirModalClientesPendientes() {
    this.mostrarModalClientesPendientes = true;
    await this.cargarClientesPendientes();
  }

  cerrarModalClientesPendientes() {
    this.mostrarModalClientesPendientes = false;
    this.clientesPendientes = [];
  }

  async cargarClientesPendientes() {
    this.cargandoClientesPendientes = true;
    try {
      const { data, error } = await this.supabase.supabase
        .from('clientes')
        .select('id, nombre, apellido, correo, imagenPerfil')
        .is('validado', null)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error al cargar clientes pendientes:', error);
        await this.mostrarAlerta('Error', `No se pudieron cargar los clientes pendientes: ${error.message}`);
        return;
      }

      this.clientesPendientes = data || [];
      console.log('Clientes pendientes cargados:', this.clientesPendientes.length);
    } catch (error) {
      console.error('Error inesperado al cargar clientes pendientes:', error);
      await this.mostrarAlerta('Error', 'Error inesperado al cargar los clientes pendientes.');
    } finally {
      this.cargandoClientesPendientes = false;
    }
  }

  async aprobarCliente(cliente: any) {
    try {
      const { error } = await this.supabase.supabase
        .from('clientes')
        .update({ 
          validado: true,
          aceptado: true
        })
        .eq('id', cliente.id);

      if (error) {
        await this.mostrarAlerta('Error', 'No se pudo aprobar el cliente.');
        return;
      }

      await this.mostrarAlerta('Éxito', 'Cliente aprobado exitosamente.');
      await this.cargarClientesPendientes();
    } catch (error) {
      await this.mostrarAlerta('Error', 'Error inesperado al aprobar el cliente.');
    }
  }

  async rechazarCliente(cliente: any) {
    try {
      const { error } = await this.supabase.supabase
        .from('clientes')
        .update({ 
          validado: false,
          aceptado: false
        })
        .eq('id', cliente.id);

      if (error) {
        await this.mostrarAlerta('Error', 'No se pudo rechazar el cliente.');
        return;
      }

      await this.mostrarAlerta('Éxito', 'Cliente rechazado exitosamente.');
      await this.cargarClientesPendientes();
    } catch (error) {
      await this.mostrarAlerta('Error', 'Error inesperado al rechazar el cliente.');
    }
  }
}
