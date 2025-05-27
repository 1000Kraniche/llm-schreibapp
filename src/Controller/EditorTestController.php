<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class EditorTestController extends AbstractController
{
    #[Route('/editor-test', name: 'editor_test')]
    public function test(): Response
    {
        return $this->render('page/editor-test.html.twig', [
            'content' => '<h1>Test-Überschrift</h1><p>Das ist ein <strong>Test-Absatz</strong> für den neuen Editor.</p>',
        ]);
    }
}